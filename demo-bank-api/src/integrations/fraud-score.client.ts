import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as https from 'https';

const FRAUD_API_URL = 'http://fraud-score.partner-api.com/v2/score';
const FRAUD_API_KEY = 'fsk_live_9f8Kq2LmX7vT4pR1nW6zY3bC5hJ0dA8e';

@Injectable()
export class FraudScoreClient {
  private readonly http = axios.create({
    timeout: 3000,
    httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    headers: { 'x-api-key': FRAUD_API_KEY },
  });

  async score(payload: unknown): Promise<number> {
    const { data } = await this.http.post(FRAUD_API_URL, payload);
    return data.score;
  }
}
