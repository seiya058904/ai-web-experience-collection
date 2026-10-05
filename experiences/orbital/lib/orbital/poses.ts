export interface Pose { x:number;y:number;scale:number;rz:number;ry:number;split:number;flame:number;earth:number;ex:number;ey:number;er:number;orbit:number;star:number; }
export const POSES: Pose[] = [
 {x:6.6,y:3.4,scale:.39,rz:-.73,ry:.55,split:0,flame:0,earth:0,ex:6,ey:-7,er:4.6,orbit:0,star:.33},
 {x:5.35,y:1.3,scale:.67,rz:0,ry:.4,split:0,flame:1,earth:0,ex:5,ey:-7,er:5,orbit:0,star:.05},
 {x:6.1,y:1.8,scale:.62,rz:-.21,ry:.6,split:0,flame:1,earth:0,ex:5,ey:-8,er:7,orbit:0,star:.15},
 {x:5.0,y:.0,scale:.73,rz:-.53,ry:.9,split:1.25,flame:.18,earth:0,ex:5,ey:-8,er:7,orbit:0,star:.65},
 {x:3.5,y:-.7,scale:1.04,rz:-1.12,ry:.95,split:1.55,flame:0,earth:0,ex:-2.0,ey:-10.7,er:8,orbit:.05,star:.5},
 {x:7.1,y:.7,scale:.17,rz:-1.75,ry:.75,split:0,flame:.04,earth:1,ex:4.5,ey:.0,er:5.3,orbit:1,star:.75},
 {x:1.3,y:-.5,scale:.135,rz:-1.55,ry:.7,split:0,flame:.05,earth:0,ex:-9.5,ey:-2.5,er:.5,orbit:.18,star:.55},
 {x:5.8,y:-.2,scale:.115,rz:-1.97,ry:1.05,split:0,flame:.035,earth:0,ex:-12,ey:-3,er:.07,orbit:0,star:1},
];
export const MOBILE: Partial<Pose>[] = [
 {x:2.5,y:-.8,scale:.24,rz:-.65},
 {x:2.6,y:-1.75,scale:.4},
 {x:2.1,y:-1.9,scale:.4},
 {x:1.1,y:-3.4,scale:.33,rz:-.7},
 {x:0,y:-3.65,scale:.42,rz:-1.18,ex:-1.8,ey:-9.5,er:6.0},
 {x:2.4,y:-3.5,scale:.075,ex:1.4,ey:-4.9,er:3.2},
 {x:1.2,y:-4.0,scale:.095,ex:-5,ey:-4,er:.3},
 {x:2.7,y:-3.8,scale:.06},
];


export const COMPACT: Partial<Pose>[] = [{},{},{},{},{x:5.5,y:.2,scale:.8},{},{},{}];
