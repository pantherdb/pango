import { environment } from '../../environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class PangoGraphQLService {
  graphQLUrl = environment.pangoGraphQLUrl;

  constructor(private httpClient: HttpClient) {
  }

  public query<T>(options: {
    query: string;
    variables?: { [key: string]: any };
  }): Observable<T> {
    return this.httpClient
      .post<{ data: T }>(this.graphQLUrl, {
        query: options.query,
        variables: options.variables,
      })
      .pipe(map((d) => d.data));
  }

  public mutate<T>(options: {
    mutation: string;
    variables?: { [key: string]: any };
  }): Observable<any> {
    return this.httpClient
      .post<{ data: T }>(this.graphQLUrl, {
        query: options.mutation,
        variables: options.variables,
      })
      .pipe(map((d) => d.data));
  }
}
