import { JwtPayload } from "jsonwebtoken";
import { Server } from "socket.io";

declare global {
  namespace Express {
    interface Request {
      user: JwtPayload;
      io: Server;
      socketUserMap?: Map<string, string>;
    }
  }
}