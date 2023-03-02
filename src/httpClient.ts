import { Config } from './config';

const BASE_URL = 'https://identitytoolkit.googleapis.com/v1';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD';

interface HttpRequestConfig {
  path: string;
  headers?: Headers;
  data?: BodyInit | null;
  method: HttpMethod;
}

export interface HttpClient {
  send(req: HttpRequestConfig): Promise<Response>;
}

export class AuthorizedHttpClient implements HttpClient {
  private config: Config;

  constructor(config: Config) {
    this.config = config;
  }

  public async send(req: HttpRequestConfig): Promise<Response> {
    const token = await this.config.getToken();
    const headerClone = Object.assign(new Headers(), req.headers);

    if (!headerClone.get('Authorization')) {
      headerClone.set('Authorization', `Bearer ${token.accessToken}`);
    }

    if (req.data) {
      headerClone.set('Content-Type', 'application/json');
    }

    return fetch(BASE_URL + req.path, {
      headers: headerClone,
      body: req.data,
      method: req.method,
    });
  }
}
