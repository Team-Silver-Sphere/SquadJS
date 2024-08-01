import { SquadServerConfig } from './squad-server-config';

export interface Config {
  server: SquadServerConfig;
  logger?: {
    verboseness?: { [key: string]: number; };
    colors?: { [key: string]: number; };
    timestamps?: boolean;
  }
}