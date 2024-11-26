import { environment } from '../../environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';

export enum ApiVersion {
  V2023 = 'pango-2023',
  V2024 = 'pango-2024',
}

@Injectable({
  providedIn: 'root'
})
export class PangoGraphQLService {
  graphQLUrl = environment.pangoGraphQLUrl;
  private currentVersion: ApiVersion = ApiVersion.V2024;
  private readonly VERSION_PARAM = 'apiVersion';

  constructor(
    private httpClient: HttpClient,
    public route: ActivatedRoute,
    private router: Router
  ) {
    // Initialize version from query params if present
    this.route.queryParams.subscribe(params => {
      console.log('params', params);
      if (params[this.VERSION_PARAM]) {
        const paramVersion = params[this.VERSION_PARAM];
        if (Object.values(ApiVersion).includes(paramVersion)) {
          this.currentVersion = paramVersion as ApiVersion;
        }
      }
    });
  }

  setVersion(version: ApiVersion, updateUrl: boolean = true) {
    this.currentVersion = version;
    console.log('Setting version to', version);
    if (updateUrl) {
      this.updateQueryParam(version);
    }
  }

  private updateQueryParam(version: ApiVersion) {
    const queryParams = { ...this.route.snapshot.queryParams };

    if (version === ApiVersion.V2024) {
      // Remove param if it's the default version
      delete queryParams[this.VERSION_PARAM];
    } else {
      queryParams[this.VERSION_PARAM] = version;
    }

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge'
    });
  }

  private resolveVersion(version?: ApiVersion): string {
    const resolvedVersion = version || this.currentVersion;
    return resolvedVersion;
  }

  private getHeaders(version?: ApiVersion): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'X-API-Version': this.resolveVersion(version)
    });
  }

  public query<T>(options: {
    query: string;
    variables?: { [key: string]: any };
    version?: ApiVersion;
  }): Observable<T> {
    return this.httpClient
      .post<{ data: T }>(
        this.graphQLUrl,
        {
          query: options.query,
          variables: options.variables,
        },
        { headers: this.getHeaders(options.version) }
      )
      .pipe(map((d) => d.data));
  }

  public mutate<T>(options: {
    mutation: string;
    variables?: { [key: string]: any };
    version?: ApiVersion;
  }): Observable<T> {
    return this.httpClient
      .post<{ data: T }>(
        this.graphQLUrl,
        {
          query: options.mutation,
          variables: options.variables,
        },
        { headers: this.getHeaders(options.version) }
      )
      .pipe(map((d) => d.data));
  }

  public getCurrentVersion(): ApiVersion {
    return this.currentVersion;
  }
}