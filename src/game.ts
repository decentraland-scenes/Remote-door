///// Custom components



@Component('doorState')
export class DoorState {
  closed: boolean = true
  openPos: Quaternion = Quaternion.Euler(0, 90, 0)
  closedPos: Quaternion = Quaternion.Euler(0, 0, 0)
  fraction: number = 0
}

const doors = engine.getComponentGroup(DoorState)

// how often to refresh scene, in seconds
const refreshInterval: number = 1
let refreshTimer: number = refreshInterval

//// Systems

export class RotatorSystem implements ISystem {
 
  update(dt: number) {
    for (let door of doors.entities) {
      let state = door.get(DoorState)
      let transform = door.get(Transform)
      
      if (state.closed == false && state.fraction < 1) {
        state.fraction += dt
        let rot = Quaternion.Slerp(state.closedPos, state.openPos, state.fraction)
        transform.rotation = rot
      } else if (state.closed == true && state.fraction > 0) {
        state.fraction -= dt
        let rot = Quaternion.Slerp(state.closedPos, state.openPos, state.fraction)
        transform.rotation = rot
      }
    }
  }
}

// Add system to engine
engine.addSystem(new RotatorSystem())

export class CheckServer implements ISystem {
  update(dt:number){
    refreshTimer -= dt
    if (refreshTimer <0){
      refreshTimer = refreshInterval
      getFromServer()
    }
  }

}
engine.addSystem(new CheckServer())


/////// Add scenery

let collideBox = new BoxShape()
collideBox.withCollisions = true

// Define fixed walls
const wall1 = new Entity()
wall1.set(new Transform({
  position: new Vector3(5.75, 1, 3),
  scale: new Vector3(1.5, 2, 0.05)
}))
wall1.set(collideBox)
engine.addEntity(wall1)

const wall2 = new Entity()
wall2.set(new Transform({
  position: new Vector3(3.25, 1, 3),
  scale: new Vector3(1.5, 2, 0.05)
}))
wall2.set(collideBox)
engine.addEntity(wall2)


// Add actual door to scene. This entity doesn't rotate, its parent drags it with it.
const door = new Entity()
door.set(new Transform({
  position: new Vector3(0.5, 0, 0),
  scale: new Vector3(1, 2, 0.05)
}))
door.set(collideBox)
engine.addEntity(door)

// Define a material to color the door red
const doorMaterial = new Material()
doorMaterial.albedoColor = Color3.Red()
doorMaterial.metallic = 0.9
doorMaterial.roughness = 0.1

// Assign the material to the door
door.set(doorMaterial)

// Define wrapper entity to rotate door. This is the entity that actually rotates.
const doorPivot = new Entity()
doorPivot.set(new Transform({
  position: new Vector3(4, 1, 3)
}))
doorPivot.set(new DoorState())
engine.addEntity(doorPivot)

// Set the door as a child of doorPivot
door.setParent(doorPivot)

// Set the click behavior for the door
door.set(
  new OnClick(e => {
    let state = door.getParent().get(DoorState)
    state.closed = !state.closed
    callAPI(state.closed)
  })
)


///// Connect to the REST API

const apiUrl = "http://127.0.0.1:7753"

const headers = {
  Accept: "application/json",
  "Content-Type": "application/json"
};

// function called when activating door
function callAPI(closed: boolean){
  let url
  if (closed){
    url = `${apiUrl}/api/door/close`
  }
  else {
    url = `${apiUrl}/api/door/open`
  }

  executeTask(async () => {
    try {
      let response = await fetch(url)
      let json = await response.json()
      log("sent request to API " + closed)
    } catch {
      log("failed to reach URL")
    }
  })
  getFromServer()

}

// Function called at regular intervals
function getFromServer(){
 
  let url = `${apiUrl}/api/door/state`
  
  executeTask(async () => {
    try {
      let response = await fetch(url)
      let json = await response.json()
      log("sent request to API")
      log(json)
      doorPivot.get(DoorState).closed = json.state
        
    } catch {
      log("failed to reach URL")
    }

   })
}

// Start the scene with the door's state matching the server
getFromServer()