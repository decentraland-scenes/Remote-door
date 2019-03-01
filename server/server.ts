import * as express from "express";
import * as cors from "cors";

//
// express app config
//
const expressApp = express();
const doorRouter = express.Router();
const port = 7753;
const host = "127.0.0.1";

expressApp.use(cors());

//
// Variable to store door state
//

let closed : boolean = true


//
//POST close door
//
doorRouter.get("/close", function(req: express.Request, res: express.Response) {
  closed = true
  console.log("CLOSED DOOR", closed)

  
  res.status(200).json({"state":closed})
});

// POST open door

doorRouter.get("/open", function(req: express.Request, res: express.Response) {

  closed = false
  console.log("OPENED DOOR", closed)
  res.status(200).json({"state":closed})
});

doorRouter.get("/state", function(req: express.Request, res: express.Response) {
  res.status(200).json({"state":closed})
});


//
// attach the door REST router
//
expressApp.use("/api/door", doorRouter);

//
// start up the express app
//
expressApp.listen(port, host);
console.log(`listening http://${host}:${port}`);
