#!/usr/bin/env python3

import argparse
import os
import re
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime
from collections import defaultdict

# Compiled regex pattern with named groups for nginx log parsing
LOG_PATTERN = re.compile(
    r'(?P<ip>\S+)\s+'              # IP Address
    r'\S+\s+'                      # remote logname (usually '-')
    r'\S+\s+'                      # remote user (usually '-')
    r'\[(?P<time>[^\]]+)\]\s+'     # [time]
    r'"(?P<method>\S+)\s+'         # "HTTP method
    r'(?P<path>[^\s]+)\s+'         # resource path
    r'(?P<protocol>[^"]+)"\s+'     # protocol
    r'(?P<status>\d+)\s+'          # status code
    r'(?P<size>\d+)\s+'            # body bytes sent
    r'"(?P<referrer>[^"]*)"\s*'    # "referrer"
    r'"(?P<user_agent>[^"]*)"'     # "user agent"
)

def parse_nginx_log(log_file):
    """Parse NGINX access log file into a pandas DataFrame"""
    data = []
    
    with open(log_file, 'r', encoding='utf-8') as f:
        for line in f:
            match = LOG_PATTERN.match(line.strip())
            if match:
                log_data = match.groupdict()
                
                # Convert numeric fields
                log_data['status'] = int(log_data['status'])
                log_data['size'] = int(log_data['size'])
                
                # Handle referrer
                if log_data['referrer'] == '-':
                    log_data['referrer'] = None
                    
                data.append(log_data)
    

    df = pd.DataFrame(data)
    
    df['time'] = pd.to_datetime(df['time'], format='%d/%b/%Y:%H:%M:%S %z')
    df['date'] = df['time'].dt.date
    df['hour'] = df['time'].dt.hour
    df['device_type'] = df['user_agent'].apply(extract_device_type)
    df['browser'] = df['user_agent'].apply(extract_browser)
    df['is_bot'] = df['user_agent'].str.contains('bot|Bot|crawl|Crawl|spider|Spider|Expanse', case=False)
    
    return df

def extract_device_type(user_agent_string):
    """Extract device type from user agent string"""
    
    if pd.isna(user_agent_string):
        return 'Unknown'
    
    if 'Mobile' in user_agent_string or 'Android' in user_agent_string or 'iPhone' in user_agent_string:
        return 'Mobile'
    elif 'Tablet' in user_agent_string or 'iPad' in user_agent_string:
        return 'Tablet'
    else:
        return 'Desktop'

def extract_browser(user_agent_string):
    """Extract browser from user agent string"""
    
    if pd.isna(user_agent_string):
        return 'Unknown'
    
    if 'Expanse' in user_agent_string or 'bot' in user_agent_string.lower() or 'crawl' in user_agent_string.lower():
        return 'Bot'
    elif 'Chrome' in user_agent_string and 'Edg' not in user_agent_string:
        return 'Chrome'
    elif 'Firefox' in user_agent_string:
        return 'Firefox'
    elif 'Safari' in user_agent_string and 'Chrome' not in user_agent_string:
        return 'Safari'
    elif 'Edg' in user_agent_string:
        return 'Edge'
    else:
        return 'Other'

def analyze_logs(df, output_dir):
    """Analyze log data, print summary statistics, and save to CSV files"""
    
    print("\n===== NGINX Log Analysis =====")
    print(f"Total requests: {len(df)}")
    
    parsed_csv_path = os.path.join(output_dir, "parsed_data.csv")
    df.to_csv(parsed_csv_path, index=False)
    
    print("\n=== Time-based Metrics ===")
    print(f"Date range: {df['date'].min()} to {df['date'].max()}")
    
    date_counts = df.groupby('date').size()
    date_counts_csv = os.path.join(output_dir, "requests_by_date.csv")
    date_counts.to_csv(date_counts_csv, header=['count'])
    
    # Status code distribution
    status_counts = df['status'].value_counts().sort_index()
    status_counts_csv = os.path.join(output_dir, "status_counts.csv")
    status_counts.to_csv(status_counts_csv, header=['count'])
    
    # Top IP addresses
    ip_counts = df['ip'].value_counts().head(10)
    ip_counts_csv = os.path.join(output_dir, "top_ips.csv")
    ip_counts.to_csv(ip_counts_csv, header=['count'])
    
    # Top requested paths
    path_counts = df['path'].value_counts().head(10)
    path_counts_csv = os.path.join(output_dir, "top_paths.csv")
    path_counts.to_csv(path_counts_csv, header=['count'])
    
    # HTTP methods
    method_counts = df['method'].value_counts()
    method_counts_csv = os.path.join(output_dir, "method_counts.csv")
    method_counts.to_csv(method_counts_csv, header=['count'])
    
    # Top referrers
    referrer_counts = df['referrer'].dropna().value_counts().head(10)
    if not referrer_counts.empty:
        referrer_counts_csv = os.path.join(output_dir, "referrer_counts.csv")
        referrer_counts.to_csv(referrer_counts_csv, header=['count'])
    
    # Browser distribution
    browser_counts = df['browser'].value_counts()
    browser_counts_csv = os.path.join(output_dir, "browser_counts.csv")
    browser_counts.to_csv(browser_counts_csv, header=['count'])
    
    # Device type distribution
    device_counts = df['device_type'].value_counts()
    device_counts_csv = os.path.join(output_dir, "device_counts.csv")
    device_counts.to_csv(device_counts_csv, header=['count'])
    
    # Bot traffic
    bot_percentage = df['is_bot'].mean() * 100
    print(f"\n=== Bot Traffic ===")
    print(f"Bot requests: {df['is_bot'].sum()} ({bot_percentage:.2f}%)")
    
    # Largest responses
    largest_responses = df[['path', 'size']].sort_values('size', ascending=False).head(10)
    largest_responses_csv = os.path.join(output_dir, "largest_responses.csv")
    largest_responses.to_csv(largest_responses_csv, index=False)
    print(f"Saved largest responses to {largest_responses_csv}")
    
    # Requests over time
    df_copy = df.copy()
    df_copy.set_index('time', inplace=True)
    requests_per_minute = df_copy.resample('1Min')['method'].count()
    requests_per_hour = df_copy.resample('1h')['method'].count()
    
    requests_per_minute_csv = os.path.join(output_dir, "requests_per_minute.csv")
    requests_per_hour_csv = os.path.join(output_dir, "requests_per_hour.csv")
    
    requests_per_minute.to_csv(requests_per_minute_csv, header=['count'])
    requests_per_hour.to_csv(requests_per_hour_csv, header=['count'])
    

def visualize_logs(df, output_dir):
    
    sns.set(style="whitegrid")
    
    # 1. Requests over time
    df_copy = df.copy()
    df_copy.set_index('time', inplace=True)
    
    # Requests per minute
    plt.figure(figsize=(12, 6))
    requests_per_minute = df_copy.resample('1Min')['method'].count()
    requests_per_minute.plot(kind='line')
    plt.title('Requests Per Minute')
    plt.xlabel('Time')
    plt.ylabel('Number of Requests')
    plt.tight_layout()
    plt.savefig(f"{output_dir}/requests_per_minute.png")
    plt.close()
    
    # Requests per hour
    plt.figure(figsize=(12, 6))
    requests_per_hour = df_copy.resample('1h')['method'].count()
    requests_per_hour.plot(kind='line')
    plt.title('Requests Per Hour')
    plt.xlabel('Time')
    plt.ylabel('Number of Requests')
    plt.tight_layout()
    plt.savefig(f"{output_dir}/requests_per_hour.png")
    plt.close()
    
    # 2. Status code distribution
    plt.figure(figsize=(10, 6))
    status_counts = df['status'].value_counts().sort_index()
    status_counts.plot(kind='bar', color='skyblue')
    plt.title('HTTP Status Code Distribution')
    plt.xlabel('Status Code')
    plt.ylabel('Count')
    plt.xticks(rotation=0)
    plt.tight_layout()
    plt.savefig(f"{output_dir}/status_codes.png")
    plt.close()
    
    # 3. Browser distribution pie chart
    plt.figure(figsize=(10, 8))
    browser_counts = df['browser'].value_counts()
    plt.pie(browser_counts, labels=browser_counts.index, autopct='%1.1f%%', startangle=90)
    plt.axis('equal')
    plt.title('Browser Distribution')
    plt.tight_layout()
    plt.savefig(f"{output_dir}/browsers.png")
    plt.close()
    
    # 4. Device type distribution
    plt.figure(figsize=(10, 6))
    device_counts = df['device_type'].value_counts()
    device_counts.plot(kind='bar', color='lightgreen')
    plt.title('Device Type Distribution')
    plt.xlabel('Device Type')
    plt.ylabel('Count')
    plt.xticks(rotation=0)
    plt.tight_layout()
    plt.savefig(f"{output_dir}/devices.png")
    plt.close()
    
    # 5. Top 10 IP addresses
    plt.figure(figsize=(12, 6))
    ip_counts = df['ip'].value_counts().head(10)
    ip_counts.plot(kind='bar', color='coral')
    plt.title('Top 10 IP Addresses')
    plt.xlabel('IP Address')
    plt.ylabel('Count')
    plt.xticks(rotation=45, ha='right')
    plt.tight_layout()
    plt.savefig(f"{output_dir}/top_ips.png")
    plt.close()
    
    # 6. Top 10 paths
    plt.figure(figsize=(12, 6))
    path_counts = df['path'].value_counts().head(10)
    path_counts.plot(kind='barh', color='coral')
    plt.title('Top 10 Requested Paths')
    plt.xlabel('Count')
    plt.ylabel('Path')
    plt.tight_layout()
    plt.savefig(f"{output_dir}/top_paths.png")
    plt.close()
    
    # 7. Response size distribution
    plt.figure(figsize=(12, 6))
    df['size'].plot(kind='hist', bins=50, color='purple', alpha=0.7)
    plt.title('Response Size Distribution')
    plt.xlabel('Response Size (bytes)')
    plt.ylabel('Frequency')
    plt.tight_layout()
    plt.savefig(f"{output_dir}/response_sizes.png")
    plt.close()

    print(f"Saved all visualizations to {output_dir}")

def main():
    parser = argparse.ArgumentParser(description='NGINX Log Analyzer')
    parser.add_argument('-i', '--input', required=True, help='Path to the NGINX access log file')
    parser.add_argument('-o', '--output', required=True, help='Directory to save analysis results')
    
    args = parser.parse_args()
    
    print(f"Parsing log file: {args.input}")
    df = parse_nginx_log(args.input)
    
    os.makedirs(args.output, exist_ok=True)
    
    analyze_logs(df, args.output)
    visualize_logs(df, args.output)
    
    print("\nAnalysis complete!")

if __name__ == "__main__":
    main()
    
#  python src/nginx_log_analyzer.py downloads/all_access_logs.txt --visualize --output-dir reports