import { Request, Response, NextFunction, RequestHandler } from 'express'

type AsyncFn<T extends Request = Request> = (
  req: T,
  res: Response,
  next: NextFunction
) => Promise<void>

export function asyncHandler<T extends Request = Request>(fn: AsyncFn<T>): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req as T, res, next)).catch(next)
}
