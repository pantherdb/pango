import pandas as pd
import re
import matplotlib.pyplot as plt
import seaborn as sns
import argparse
import os
import json

def parse_log_file(log_file):
    """Parse nginx log file and return dataframe with functionome.geneontology.org entries"""
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
    
    data = []
    
    with open(log_file, 'r') as f:
        for line in f:
            match = LOG_PATTERN.match(line.strip())
            if match:
                log_data = match.groupdict()
                
                if "functionome.geneontology.org" in log_data['referrer']:
                    log_data['status'] = int(log_data['status'])
                    log_data['size'] = int(log_data['size'])
                    data.append(log_data)
    
    df = pd.DataFrame(data)
    
    df = df.rename(columns={
        'time': 'timestamp',
        'size': 'response_size',
        'status': 'status_code'
    })
    
    return df

def load_gene_lookup(lookup_file):
    """Load gene lookup data from JSON file"""
    with open(lookup_file, 'r') as f:
        lookup_data = json.load(f)
    
    gene_lookup = {}
    for entry in lookup_data:
        gene_id = entry.get('gene')
        gene_name = entry.get('gene_name')
        if gene_id and gene_name:
            gene_lookup[gene_id] = gene_name
            
            # Also extract UniProtKB ID from long_id if available
            long_id = entry.get('long_id')
            if long_id:
                uniprot_match = re.search(r'UniProtKB=([A-Z0-9]+)', long_id)
                if uniprot_match:
                    uniprot_id = uniprot_match.group(1)
                    gene_lookup[f'UniProtKB:{uniprot_id}'] = gene_name
    
    return gene_lookup

def extract_uniprot_ids(df, gene_lookup=None):
    """Extract UniProt IDs from referrer URLs and map to gene names if lookup provided"""
    uniprot_pattern = r'UniProtKB[:|%3A]([A-Z0-9]+)'
    
    def extract_id(referrer):
        match = re.search(uniprot_pattern, referrer)
        if match:
            return match.group(1)
        return None
    
    # Extract UniProt IDs
    df['uniprot_id'] = df['referrer'].apply(extract_id)
    
    # Add gene name if lookup is provided
    if gene_lookup:
        def get_gene_name(uniprot_id):
            if not uniprot_id:
                return None
            gene_id = f"UniProtKB:{uniprot_id}"
            return gene_lookup.get(gene_id, "Unknown")
        
        df['gene_name'] = df['uniprot_id'].apply(get_gene_name)
    
    # Filter out rows with no UniProt ID
    df_uniprot = df[df['uniprot_id'].notna()].copy()
    
    return df_uniprot

def count_uniprot_access(df_uniprot, use_gene_names=False):
    """Count access frequency for each UniProt ID or gene name"""
    if use_gene_names and 'gene_name' in df_uniprot.columns:
        # Group by gene name instead of UniProt ID
        id_to_name = dict(zip(df_uniprot['uniprot_id'], df_uniprot['gene_name']))
        
        gene_counts = df_uniprot['gene_name'].value_counts().reset_index()
        gene_counts.columns = ['gene_name', 'count']
        
        # Add corresponding UniProt IDs for each gene name
        def get_uniprot_ids(name):
            return ', '.join([uid for uid, gname in id_to_name.items() if gname == name])
        
        gene_counts['uniprot_ids'] = gene_counts['gene_name'].apply(get_uniprot_ids)
        
        return gene_counts.sort_values('count', ascending=False)
    else:
        # Count by UniProt ID
        uniprot_counts = df_uniprot['uniprot_id'].value_counts().reset_index()
        uniprot_counts.columns = ['uniprot_id', 'count']
        
        # Add gene name if available
        if 'gene_name' in df_uniprot.columns:
            # Get a mapping from UniProt ID to gene name (using first occurrence)
            id_to_name = {}
            for _, row in df_uniprot.iterrows():
                if row['uniprot_id'] not in id_to_name and not pd.isna(row['gene_name']):
                    id_to_name[row['uniprot_id']] = row['gene_name']
            
            uniprot_counts['gene_name'] = uniprot_counts['uniprot_id'].map(id_to_name)
        
        return uniprot_counts.sort_values('count', ascending=False)

def save_filtered_log(df, output_file):
    """Save filtered log entries to a file"""
    with open(output_file, 'w') as f:
        for _, row in df.iterrows():
            log_line = f"{row['ip']} - - [{row['timestamp']}] \"{row['method']} {row['path']} {row['protocol']}\" {row['status_code']} {row['response_size']} \"{row['referrer']}\" \"{row['user_agent']}\""
            f.write(log_line + '\n')

def plot_uniprot_frequency(counts_df, output_file, top_n=20):
    """Plot frequency graph of gene accesses"""
    plot_data = counts_df.head(top_n).copy()
    
    # Determine what to plot based on available columns
    if 'gene_name' in plot_data.columns and not plot_data['gene_name'].isna().all():
        def get_label(row):
            if pd.isna(row['gene_name']) or row['gene_name'] == 'Unknown':
                return row['uniprot_id']
            return f"{row['gene_name']} ({row['uniprot_id']})"
        
        plot_data['label'] = plot_data.apply(get_label, axis=1)
        y_label = 'Gene (UniProt ID)'
    elif 'uniprot_ids' in plot_data.columns:
        def get_label(row):
            return f"{row['gene_name']} ({row['uniprot_ids']})"
        
        plot_data['label'] = plot_data.apply(get_label, axis=1)
        y_label = 'Gene Name (UniProt IDs)'
    else:
        plot_data['label'] = plot_data['uniprot_id']
        y_label = 'UniProt ID'
    
    plt.figure(figsize=(14, 10))
    sns.set(style="whitegrid")
    
    # Create bar plot
    ax = sns.barplot(x='count', y='label', data=plot_data, palette='viridis')
    
    # Add count labels to bars
    for i, count in enumerate(plot_data['count']):
        ax.text(count + 0.5, i, str(count), va='center')
    
    plt.title(f'Top {top_n} Gene Accesses by Frequency', fontsize=16)
    plt.xlabel('Number of Accesses', fontsize=12)
    plt.ylabel(y_label, fontsize=12)
    plt.tight_layout()
    
    plt.savefig(output_file, dpi=300)
    plt.close()
    
    print(f"Plot saved to {output_file}")

def main():
    """Main function to analyze NGINX logs for UniProtKB accesses"""
    parser = argparse.ArgumentParser(description='Analyze NGINX logs for functionome.geneontology.org UniProtKB accesses')
    parser.add_argument('log_file', help='Path to the NGINX access log file')
    parser.add_argument('--lookup-file', help='Path to gene lookup JSON file')
    parser.add_argument('--output-dir', default='.', help='Directory to save output files')
    parser.add_argument('--top-n', type=int, default=20, help='Number of top genes to include in plot')
    parser.add_argument('--group-by-gene', action='store_true', help='Group by gene name instead of UniProt ID')
    
    args = parser.parse_args()
    
    # Create output directory if it doesn't exist
    os.makedirs(args.output_dir, exist_ok=True)
    
    # Load gene lookup if provided
    gene_lookup = None
    if args.lookup_file:
        print(f"Loading gene lookup data from: {args.lookup_file}")
        gene_lookup = load_gene_lookup(args.lookup_file)
        print(f"Loaded {len(gene_lookup)} gene ID to name mappings")
    
    # Parse log file
    print(f"Parsing log file: {args.log_file}")
    df = parse_log_file(args.log_file)
    
    if df.empty:
        print("No entries found with referrer containing functionome.geneontology.org")
        return
    
    print(f"Found {len(df)} entries with functionome.geneontology.org referrer")
    
    # Save filtered log
    filtered_log_file = os.path.join(args.output_dir, 'filtered_functionome_access.log')
    save_filtered_log(df, filtered_log_file)
    print(f"Filtered log saved to {filtered_log_file}")
    
    # Extract UniProt IDs and map to gene names if lookup is provided
    df_uniprot = extract_uniprot_ids(df, gene_lookup)
    
    if df_uniprot.empty:
        print("No UniProtKB IDs found in the log entries")
        return
    
    print(f"Found {len(df_uniprot)} entries with UniProtKB IDs")
    
    # Count accesses (by gene name or UniProt ID)
    counts = count_uniprot_access(df_uniprot, args.group_by_gene and gene_lookup)
    
    if args.group_by_gene and 'gene_name' in counts.columns:
        counts_file = os.path.join(args.output_dir, 'gene_access_counts.csv')
    else:
        counts_file = os.path.join(args.output_dir, 'uniprot_access_counts.csv')
    
    counts.to_csv(counts_file, index=False)
    print(f"Access counts saved to {counts_file}")
    
    # Display top entries
    print(f"\nTop 10 {'Genes' if args.group_by_gene else 'UniProt IDs'} by access frequency:")
    if args.group_by_gene and 'gene_name' in counts.columns:
        for _, row in counts.head(10).iterrows():
            print(f"{row['gene_name']} ({row['uniprot_ids']}): {row['count']} accesses")
    elif 'gene_name' in counts.columns:
        for _, row in counts.head(10).iterrows():
            gene_name = row['gene_name'] if pd.notna(row['gene_name']) else "Unknown"
            print(f"{row['uniprot_id']} ({gene_name}): {row['count']} accesses")
    else:
        for _, row in counts.head(10).iterrows():
            print(f"{row['uniprot_id']}: {row['count']} accesses")
    
    # Plot frequency
    plot_file = os.path.join(args.output_dir, 'gene_access_frequency.png')
    plot_uniprot_frequency(counts, plot_file, args.top_n)

if __name__ == "__main__":
    main()