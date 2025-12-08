export {};

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PORT: string;
      DATABASE_USER: string;
      DATABASE_PASSWORD: string;
      DATABASE_NAME: string;
      DATABASE_SERVER: string;
    }
  }
}
