import "server-only";

// アプリ用の入口。seedはconnection.tsを直接読む。
export { client, db } from "./connection";
