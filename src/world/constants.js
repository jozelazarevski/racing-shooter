// World-geometry constants shared by the track builder, the vehicles
// (rim traction limit) and the chase camera (tunnel bore).

/** Where the world's border wall begins. Vehicles read this: the traction
 *  limit that makes the wall unclimbable must apply HERE and nowhere else. */
export const RIM_RADIUS = 1620;

export const ROAD_HALF = 9; // drivable half-width
// bore section, shared by the tunnel mesh and by anything that has to know
// whether a point is INSIDE a tunnel (the chase camera, above all)
export const TUNNEL_HW = 11.6, TUNNEL_APEX = 8.6;
export const WALL_OFF = 10.4;

/** How many samples the centreline is resampled to. Every per-index lookup in
 *  the game — elevation, width, slope, hazard placement — is an index into an
 *  array this long, so it is one number and not a per-file literal. */
export const CENTER_SAMPLES = 900;
