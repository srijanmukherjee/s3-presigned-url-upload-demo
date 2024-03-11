import { Request, Response } from "express";

// handle asychronous controllers
function acontroller(controller: (req: Request, res: Response) => Promise<unknown>) {
    return async (req: Request, res: Response) => {
        try {
            await controller(req, res);
        } catch (error) {
            console.error(error);

            if (!res.headersSent) {
                return res.status(500).json({ error: "Something went wrong" });
            }
        }
    }
}

export { acontroller };