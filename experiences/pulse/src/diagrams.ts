/**
 * Original PULSE atlas plates. An anterior, simplified cutaway is used throughout.
 * Anatomical right is viewer-left. The diagrams are explanatory reconstructions.
 * Posterior pulmonary venous connections are exposed, not front-surface vessels.
 */

const clean = (value: string) => value.replace(/[^a-zA-Z0-9_-]/g, '-');
const shellPath = 'M237 152C209 155 181 182 177 228C156 268 164 316 189 367C225 442 311 495 407 548C428 559 443 538 459 515C508 447 549 350 531 273C522 235 492 197 468 184C441 144 402 143 365 157C327 129 289 121 263 145Z';

function defs(id: string) {
  return `<defs>
    <linearGradient id="${id}-muscle" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#955461"/><stop offset=".42" stop-color="#632b3b"/><stop offset="1" stop-color="#30151f"/></linearGradient>
    <linearGradient id="${id}-wall" x1="0" y1="0" x2="1" y2=".6"><stop stop-color="#e0a39f"/><stop offset=".25" stop-color="#9a5563"/><stop offset="1" stop-color="#572632"/></linearGradient>
    <linearGradient id="${id}-cavity" x1="0" y1="0" x2=".9" y2="1"><stop stop-color="#22131b"/><stop offset="1" stop-color="#4b2230"/></linearGradient>
    <linearGradient id="${id}-vein" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#25333c"/><stop offset=".5" stop-color="#587484"/><stop offset="1" stop-color="#2e4653"/></linearGradient>
    <linearGradient id="${id}-artery" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#6b2939"/><stop offset=".5" stop-color="#bf7479"/><stop offset="1" stop-color="#672b3b"/></linearGradient>
    <linearGradient id="${id}-air" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#2b2930"/><stop offset="1" stop-color="#3e333a"/></linearGradient>
    <linearGradient id="${id}-blood" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#441c2c"/><stop offset="1" stop-color="#7e3544"/></linearGradient>
    <radialGradient id="${id}-cell"><stop stop-color="#542031"/><stop offset=".6" stop-color="#ba666e"/><stop offset="1" stop-color="#6b293c"/></radialGradient>
    <clipPath id="${id}-shell-clip"><path d="${shellPath}"/></clipPath>
    <marker id="${id}-arrow-slate" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto" markerUnits="strokeWidth"><path d="M0 0L7 3.5L0 7Z" fill="#9ec9d0"/></marker>
    <marker id="${id}-arrow-rose" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto" markerUnits="strokeWidth"><path d="M0 0L7 3.5L0 7Z" fill="#e5a19f"/></marker>
    <marker id="${id}-arrow-gold" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto" markerUnits="strokeWidth"><path d="M0 0L7 3.5L0 7Z" fill="#ddbd86"/></marker>
  </defs>`;
}

function label(x: number, y: number, text: string, extra = '', anchor = 'start') {
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" class="svg-label ${extra}">${text}</text>`;
}

function leader(path: string, x: number, y: number) {
  return `<path d="${path}" class="svg-leader"/><circle cx="${x}" cy="${y}" r="3" class="svg-leader-dot"/>`;
}

function orientation() {
  return `<g class="orientation-labels">
    ${label(30, 32, 'ANATOMICAL RIGHT', 'svg-micro')}
    ${label(690, 32, 'ANATOMICAL LEFT', 'svg-micro', 'end')}
    <path d="M30 48H255M465 48H690" class="svg-rule"/>
    ${label(360, 38, 'ANTERIOR VIEW', 'svg-micro svg-muted', 'middle')}
  </g>`;
}

function vesselBase(id: string) {
  return `<g class="vessel-anatomy">
    <path data-vessel="aorta" d="M350 310L336 174C333 117 350 77 388 72C428 65 470 101 478 153L479 189L447 192L445 156C439 122 414 104 391 109C373 114 369 142 374 175L390 297Z" fill="url(#${id}-artery)" stroke="#d39897" stroke-width="2"/>
    <path d="M376 78L370 51M400 75L407 45M423 85L438 57" fill="none" stroke="#aa6672" stroke-width="18"/>
    <path data-vessel="cavae" d="M190 80H226L228 210H197Z" fill="url(#${id}-vein)" stroke="#8dabb5" stroke-width="2"/>
    <path data-vessel="cavae" d="M163 438C158 372 181 297 211 244L238 258C211 306 193 381 197 438Z" fill="url(#${id}-vein)" stroke="#8dabb5" stroke-width="2"/>
    <g data-vessel="pulmonary-veins" fill="url(#${id}-artery)" stroke="#c98891" stroke-width="2">
      <path d="M457 190L562 173L567 196L461 215Z"/>
      <path d="M457 229L570 224L571 247L459 254Z"/>
    </g>
  </g>`;
}

function heartShell(id: string, includeContour = true) {
  let fibers = '';
  for (let i = 0; i < 12; i++) {
    const y = 212 + i * 25;
    fibers += `<path d="M160 ${y}C249 ${y - 50} 357 ${y + 16} 542 ${y - 33}"/>`;
  }
  return `<g class="heart-shell">
    ${includeContour ? `<path d="${shellPath}" fill="url(#${id}-muscle)" stroke="#c0848b" stroke-width="2.5"/>` : ''}
    <g clip-path="url(#${id}-shell-clip)" class="myocardial-fibers">${fibers}</g>
    <path data-wall="right" d="M216 286C197 304 201 346 232 386C273 434 333 469 390 506L405 531C307 479 221 425 189 360C172 320 177 291 194 272Z" fill="url(#${id}-wall)" stroke="#bd8189" stroke-width="1.5"/>
    <path data-wall="left" d="M446 271C483 283 503 310 499 356C494 410 459 483 419 525L406 534L390 499C431 452 462 405 464 354C466 322 452 304 435 298Z" fill="url(#${id}-wall)" stroke="#d09599" stroke-width="1.5"/>
    <path data-chamber="ra" d="M217 191C220 171 257 158 283 177C303 193 306 219 302 244L290 270C267 290 230 275 219 251C207 231 207 208 217 191Z" fill="url(#${id}-cavity)" stroke="#d5a5a8" stroke-width="3"/>
    <path data-chamber="la" d="M376 181C396 163 430 170 449 191C465 211 465 239 444 260C424 279 394 265 379 247C364 228 364 198 376 181Z" fill="url(#${id}-cavity)" stroke="#d5a5a8" stroke-width="3"/>
    <path data-chamber="rv" d="M218 302C238 285 271 291 300 308C319 333 334 357 349 389L391 493C330 457 253 415 228 365C217 344 210 318 218 302Z" fill="url(#${id}-cavity)" stroke="#d5a5a8" stroke-width="3"/>
    <path data-chamber="lv" d="M381 296C406 280 440 291 457 317C480 351 458 417 429 471C416 496 408 500 397 477C379 443 362 395 356 350C352 325 364 305 381 296Z" fill="url(#${id}-cavity)" stroke="#e0b2b1" stroke-width="3.5"/>
    <path data-wall="septum" d="M306 171C324 162 345 165 361 180L363 251C357 272 344 287 351 321C358 373 381 434 406 494L393 511C359 457 339 407 322 363C307 325 306 299 312 270Z" fill="url(#${id}-wall)" stroke="#c38b93" stroke-width="1.5"/>
    <g class="trabeculae">
      <path d="M222 327L244 346L232 355M247 372L273 373L270 395M288 406L307 403L321 430M368 340L385 351L375 364M447 339L435 358L445 367M441 391L422 404L430 421M398 446L411 434L418 446"/>
    </g>
    <g class="papillary-muscles" fill="#a56573" stroke="#ca8b94" stroke-width="1.5">
      <path d="M251 376C252 348 253 333 264 331C274 338 273 363 277 391Z"/>
      <path d="M398 423C394 395 390 364 400 354C413 363 414 396 417 421Z"/>
      <path d="M433 401C433 381 434 359 443 356C453 370 451 389 447 405Z"/>
    </g>
    <g class="valve-chordae"><path d="M241 288L262 336M258 293L264 335M282 288L265 336M379 280L401 359M397 283L402 359M437 279L442 360M419 287L442 360"/></g>
    <g class="av-leaflets" fill="#d7b8b4" stroke="#f0d5c8" stroke-width="1.5">
      <path d="M222 278Q240 298 256 290L242 277Z"/>
      <path d="M284 278Q273 301 255 290L264 278Z"/>
      <path d="M376 272Q395 293 412 282L395 271Z"/>
      <path d="M446 272Q432 293 412 282L426 272Z"/>
    </g>
    <path data-vessel="pulmonary-trunk" d="M302 323C296 293 287 250 296 214C305 178 330 147 359 140L425 134L430 164L364 171C344 179 329 201 326 226C323 255 334 286 334 310Z" fill="url(#${id}-vein)" stroke="#a3b7ba" stroke-width="2"/>
    <path d="M355 143L290 126L276 150L347 171Z" fill="url(#${id}-vein)" stroke="#a3b7ba" stroke-width="2"/>
    <path d="M301 305Q317 287 333 305M350 295Q368 277 386 295" class="outflow-cusps"/>
  </g>`;
}

function chamberNames() {
  return `<g class="chamber-abbreviations">
    ${label(258, 229, 'RA', 'svg-internal', 'middle')}
    ${label(280, 355, 'RV', 'svg-internal', 'middle')}
    ${label(415, 225, 'LA', 'svg-internal', 'middle')}
    ${label(409, 363, 'LV', 'svg-internal', 'middle')}
  </g>
  <g class="chamber-callouts">
    ${leader('M222 209L159 187H30', 222, 209)}${label(30, 173, 'Right atrium')}
    ${leader('M234 354L158 374H30', 234, 354)}${label(30, 401, 'Right ventricle')}
    ${leader('M449 210L547 187H690', 449, 210)}${label(690, 173, 'Left atrium', '', 'end')}
    ${leader('M452 362L550 375H690', 452, 362)}${label(690, 402, 'Left ventricle', '', 'end')}
    ${leader('M345 373L326 540H192', 345, 373)}${label(192, 566, 'Septum')}
  </g>`;
}

function bloodRoutes(id: string) {
  return `<g data-layer="blood" class="blood-routes">
    <g data-route="systemic-return" class="route-slate" marker-end="url(#${id}-arrow-slate)">
      <path data-return-segment="entry" d="M208 90L211 185Q216 208 237 224"/>
      <path data-return-segment="entry" d="M180 425C175 365 190 293 218 254"/>
      <path data-return-segment="atrium" d="M239 227Q252 232 260 249"/>
      <path data-return-segment="valve" d="M260 253L260 284"/>
      <path data-return-segment="ventricle" d="M262 294L276 330"/>
    </g>
    <g data-route="pulmonary-out" class="route-slate" marker-end="url(#${id}-arrow-slate)"><path d="M295 362Q316 323 314 286Q307 231 321 205L346 173L408 153"/></g>
    <g data-route="pulmonary-return" class="route-rose" marker-end="url(#${id}-arrow-rose)">
      <path d="M552 187L477 201L433 219"/>
      <path d="M558 236L490 237L447 241"/>
      <path d="M414 243L414 277L410 329"/>
    </g>
    <g data-route="aortic-out" class="route-rose" marker-end="url(#${id}-arrow-rose)"><path d="M391 398Q366 342 365 292L353 182Q339 112 371 95Q413 77 445 130"/></g>
  </g>`;
}

function electricalRoutes() {
  return `<g data-layer="electrical" class="electrical-routes">
    <path d="M234 181Q245 223 288 251"/>
    <path d="M234 181Q307 127 372 188Q399 218 429 229"/>
    <path d="M288 251L313 285L334 324Q351 392 395 481"/>
    <path d="M337 340Q295 376 242 341M349 381Q302 422 269 391M361 408Q342 453 314 437"/>
    <path d="M349 379Q375 399 385 433M389 475Q437 457 449 398L446 353"/>
    <circle class="electrical-node-ring" cx="234" cy="181" r="13"/>
    <circle class="electrical-node" cx="234" cy="181" r="5"/>
    <circle class="electrical-node-ring" cx="288" cy="251" r="11"/>
    <circle class="electrical-node" cx="288" cy="251" r="5"/>
  </g>`;
}

function commonHeart(id: string, kind: string) {
  let annotations = '';
  if (kind === 'chambers') annotations = chamberNames();
  if (kind === 'signal' || kind === 'overview') annotations = `<g data-layer="electrical" class="signal-callouts">
    ${leader('M222 178L145 151H30', 222, 178)}${label(30, 133, 'SA node')}
    ${leader('M280 251L143 279H30', 280, 251)}${label(30, 305, 'AV node')}
    ${leader('M389 458L545 460H690', 389, 458)}${label(690, 486, 'Ventricular conduction', 'svg-small', 'end')}
    ${label(30, 551, 'DOTTED = ELECTRICAL SIGNAL', 'svg-micro')}
  </g>`;
  if (kind === 'return') annotations = `<g class="return-callouts">
    ${leader('M208 119L155 96H30', 208, 119)}${label(30, 79, 'Superior vena cava', 'svg-small')}
    ${label(30, 121, 'From the upper body', 'svg-note return-origin-label')}
    ${leader('M182 416L137 467H30', 182, 416)}${label(30, 494, 'Inferior vena cava', 'svg-small')}
    ${label(30, 520, 'From below the heart', 'svg-note return-origin-label')}
    ${leader('M259 284L119 302H30', 259, 284)}${label(30, 328, 'Tricuspid valve', 'svg-small')}
    ${label(259, 226, 'RA', 'svg-internal', 'middle')}${label(280, 364, 'RV', 'svg-internal', 'middle')}
    ${label(690, 543, 'BODY → RIGHT HEART', 'svg-micro', 'end')}
  </g>`;
  if (kind === 'pulmonary-return') annotations = `<g class="pulmonary-callouts">
    ${leader('M529 207L573 139H690', 529, 207)}${label(690, 115, 'Pulmonary veins', 'svg-small', 'end')}
    ${label(690, 138, 'Posterior entries exposed', 'svg-note', 'end')}
    ${leader('M414 281L554 323H690', 414, 281)}${label(690, 349, 'Mitral valve', 'svg-small', 'end')}
    ${label(415, 225, 'LA', 'svg-internal', 'middle')}${label(412, 363, 'LV', 'svg-internal', 'middle')}
    ${label(258, 226, 'RA', 'svg-internal', 'middle')}
    ${label(30, 543, 'BODY RETURN', 'svg-micro')}${label(690, 543, 'LUNG RETURN', 'svg-micro', 'end')}
  </g>`;
  if (kind === 'walls') annotations = `<g class="wall-callouts">
    ${leader('M219 388L138 410H30', 219, 388)}${label(30, 437, 'Right ventricular wall', 'svg-small')}
    ${leader('M476 399L553 410H690', 476, 399)}${label(690, 437, 'Left ventricular wall', 'svg-small', 'end')}
    ${leader('M363 295L506 259H690', 363, 295)}${label(690, 243, 'Aortic outlet', 'svg-small', 'end')}
    ${label(30, 568, 'QUALITATIVE COMPARISON · NOT TO SCALE', 'svg-micro')}
    ${label(280, 355, 'RV', 'svg-internal', 'middle')}${label(409, 363, 'LV', 'svg-internal', 'middle')}
  </g>`;
  return `${orientation()}${vesselBase(id)}${heartShell(id)}${kind === 'chambers' ? '' : bloodRoutes(id)}${kind === 'signal' || kind === 'overview' ? electricalRoutes() : ''}${annotations}`;
}

function avValve(id: string, center: number, name: string, side: string) {
  return `<g transform="translate(${center - 180} 0)">
    ${label(180, 90, name, 'svg-title', 'middle')}
    ${label(180, 120, `${side} atrium → ${side.toLowerCase()} ventricle`, 'svg-note', 'middle')}
    ${label(180, 145, name === 'Tricuspid' ? 'Three leaflets · sectional view' : 'Two leaflets · sectional view', 'svg-note', 'middle')}
    <path d="M75 186C93 157 130 154 180 162C234 151 270 161 286 187L270 254C274 304 275 377 249 438C229 483 203 511 180 524C155 509 122 480 102 435C76 375 80 304 90 253Z" fill="url(#${id}-muscle)" stroke="#b77e8a" stroke-width="2"/>
    <path d="M102 200C137 178 217 178 259 200L247 263C256 335 238 423 181 486C124 430 100 348 112 263Z" fill="url(#${id}-cavity)" stroke="#d5a6aa" stroke-width="3"/>
    <path d="M97 243Q179 220 262 243" fill="none" stroke="#f0d1c1" stroke-width="6"/>
    ${name === 'Tricuspid' ? '<path d="M142 233Q179 219 217 233L196 259Q180 271 165 258Z" fill="#be9d98" stroke="#e3c9bb" stroke-width="1.5" opacity=".65"/>' : ''}
    <path d="M105 242C130 248 141 270 151 293C144 273 134 255 122 241Z" fill="#ddc0b6" stroke="#f2dccc" stroke-width="2"/>
    <path d="M256 242C229 250 215 270 207 293C215 273 228 253 240 240Z" fill="#ddc0b6" stroke="#f2dccc" stroke-width="2"/>
    <path d="M122 423C128 394 124 361 139 344C154 362 157 398 157 435Z" fill="#a86775" stroke="#cd929a" stroke-width="2"/>
    <path d="M211 434C213 399 211 365 224 348C242 362 240 395 238 421Z" fill="#a86775" stroke="#cd929a" stroke-width="2"/>
    <g class="valve-chordae"><path d="M123 254L139 348M143 278L139 348M151 293L139 348M207 293L225 350M217 275L225 350M240 253L225 350"/></g>
    <path d="M180 191V333" class="route-slate" marker-end="url(#${id}-arrow-slate)"/>
    ${label(180, 566, 'FILLING · INLET OPEN', 'svg-micro', 'middle')}
  </g>`;
}

function outflowValve(id: string, center: number, name: string, inlet: string, outlet: string) {
  return `<g transform="translate(${center - 180} 0)">
    ${label(180, 90, name, 'svg-title', 'middle')}
    ${label(180, 120, `${inlet} → ${outlet}`, 'svg-note', 'middle')}
    <path d="M88 177C133 158 224 158 273 177L266 463C214 482 143 482 94 463Z" fill="url(#${id}-muscle)" stroke="#c88892" stroke-width="2"/>
    <path d="M111 181C152 169 209 169 250 181L244 455C201 468 155 468 117 455Z" fill="url(#${id}-cavity)" stroke="#c89198" stroke-width="2"/>
    <ellipse cx="181" cy="313" rx="96" ry="82" fill="#e2c7b7" stroke="#efd7c7" stroke-width="3"/>
    <ellipse cx="181" cy="313" rx="82" ry="69" fill="#341e28"/>
    <path d="M108 279Q180 240 246 277Q209 295 200 322Q168 305 159 321Q138 289 108 279Z" fill="#d2aea7" stroke="#f0d6c8" stroke-width="2"/>
    <path d="M246 278Q277 342 190 377Q208 344 200 322Q228 312 246 278Z" fill="#bb9290" stroke="#f0d6c8" stroke-width="2"/>
    <path d="M190 377Q98 364 108 279Q137 297 159 321Q154 349 190 377Z" fill="#c59d97" stroke="#f0d6c8" stroke-width="2"/>
    <path d="M181 444V408M181 220V183" class="route-rose" marker-end="url(#${id}-arrow-rose)"/>
    ${label(180, 516, 'Three pocketlike cusps', 'svg-small', 'middle')}
    ${label(180, 566, 'OUTLET VIEW · NO CHORDAE', 'svg-micro', 'middle')}
  </g>`;
}

function valves(id: string) {
  return `<g class="valve-family valve-family--av">${avValve(id, 180, 'Tricuspid', 'Right')}${avValve(id, 540, 'Mitral', 'Left')}</g>
    <g class="valve-family valve-family--outflow">${outflowValve(id, 180, 'Pulmonary', 'Right ventricle', 'lungs')}${outflowValve(id, 540, 'Aortic', 'Left ventricle', 'aorta')}</g>
    <path d="M360 157V535" class="svg-rule"/>`;
}

function lungs(id: string) {
  return `${orientation()}
    <g class="lung-tissue" fill="url(#${id}-muscle)" stroke="#a5707e" stroke-width="2">
      <path d="M275 106C238 92 174 123 137 182C102 237 83 331 90 416C96 467 183 484 285 452C315 444 314 401 307 351C293 282 318 180 275 106Z"/>
      <path d="M441 105C479 96 544 130 581 185C617 243 635 340 626 415C620 465 543 483 448 453C418 443 420 410 441 376C457 349 416 324 412 290C406 243 410 146 441 105Z"/>
    </g>
    <g class="lung-lobes"><path d="M101 319Q190 335 302 277M107 396Q183 378 307 351M420 307Q502 348 623 380"/></g>
    <path d="M360 68V139M360 139L293 202M360 139L429 202" fill="none" stroke="#b4aaa5" stroke-width="22" stroke-linejoin="round" opacity=".45"/>
    <g class="airway-branches"><path d="M294 202L229 238L196 292M229 238L249 322L222 383M196 292L146 323M196 292L180 380M429 202L493 238L530 291M493 238L472 323L497 387M530 291L575 323M530 291L548 387"/></g>
    <path d="M324 351C296 341 291 371 310 406C323 434 358 461 390 481C415 446 430 403 416 373C405 350 375 348 359 363C348 353 338 349 324 351Z" fill="url(#${id}-muscle)" stroke="#d6a1a3" stroke-width="2"/>
    <path d="M324 381Q342 404 381 450Q356 428 348 383Z" fill="#271821" stroke="#c3949d" stroke-width="2"/>
    <path d="M344 398L345 317Q347 268 360 240" class="route-slate" marker-end="url(#${id}-arrow-slate)"/>
    <g data-route="right-lung" class="pulmonary-branch route-slate"><path d="M359 243Q295 209 241 240L202 265" marker-end="url(#${id}-arrow-slate)"/><path d="M241 240L170 210M241 240L222 337L162 368M222 337L264 396"/></g>
    <g data-route="left-lung" class="pulmonary-branch route-slate"><path d="M359 243Q426 211 478 240L515 268" marker-end="url(#${id}-arrow-slate)"/><path d="M478 240L548 210M478 240L493 337L553 368M493 337L455 406"/></g>
    <circle cx="345" cy="324" r="10" fill="#d8bcb6" stroke="#f1dbcd" stroke-width="2"/>
    ${label(190, 518, 'Right lung', 'svg-small', 'middle')}${label(533, 518, 'Left lung', 'svg-small', 'middle')}
    ${leader('M345 325L277 533H30', 345, 325)}${label(30, 563, 'Pulmonary valve', 'svg-small')}
    ${leader('M346 387L426 560H690', 346, 387)}${label(690, 588, 'Right ventricle', 'svg-small', 'end')}
    ${label(360, 218, 'PULMONARY ARTERIES', 'svg-micro', 'middle')}`;
}

function cell(id: string, x: number, y: number, rotation: number) {
  return `<g transform="translate(${x} ${y}) rotate(${rotation})"><ellipse rx="34" ry="19" fill="url(#${id}-cell)" stroke="#cc828b" stroke-width="1.5"/><ellipse rx="18" ry="8" fill="#662a3b" opacity=".75"/></g>`;
}

function exchange(id: string) {
  return `<path d="M82 180C108 108 185 81 239 104C292 60 366 80 401 111C471 80 559 122 584 179C629 206 645 265 625 349C471 378 279 345 81 373C62 310 60 226 82 180Z" fill="url(#${id}-air)" stroke="#b7a49c" stroke-width="2"/>
    <path d="M81 373C279 345 471 378 625 349" fill="none" stroke="#e6cfc0" stroke-width="9"/>
    <path d="M80 389C276 361 476 395 638 365L641 497C474 532 271 502 80 522Z" fill="url(#${id}-blood)" stroke="#d7a5a8" stroke-width="3"/>
    <path d="M80 384C277 356 474 390 634 360" fill="none" stroke="#bd797f" stroke-width="4"/>
    ${cell(id, 160, 457, -16)}${cell(id, 356, 466, 10)}${cell(id, 560, 435, -12)}
    ${label(123, 191, 'Alveolar air', 'svg-title')}
    ${label(123, 220, 'A separate airspace', 'svg-note')}
    ${label(81, 568, 'CAPILLARY BLOOD', 'svg-micro')}
    <path d="M341 556H634" class="route-rose" marker-end="url(#${id}-arrow-rose)"/>
    ${leader('M582 367L658 318H688', 582, 367)}${label(686, 287, 'Tissue', 'svg-small', 'end')}${label(686, 310, 'barrier', 'svg-small', 'end')}
    <g data-gas="oxygen" class="gas-oxygen">
      <path d="M262 276V457" class="gas-arrow" marker-end="url(#${id}-arrow-gold)"/>
      ${label(260, 257, 'O₂', 'gas-symbol', 'middle')}
      ${label(198, 602, 'Oxygen into blood', 'svg-small', 'middle')}
    </g>
    <g data-gas="carbon" class="gas-carbon">
      <path d="M452 461V278" class="gas-arrow" marker-end="url(#${id}-arrow-slate)"/>
      ${label(451, 257, 'CO₂', 'gas-symbol', 'middle')}
      ${label(516, 602, 'Carbon dioxide toward air', 'svg-small', 'middle')}
    </g>`;
}

function systemic(id: string) {
  return `<path d="M354 62C327 61 308 82 310 108C312 128 324 141 327 157L319 177C294 182 265 187 249 205C228 228 224 257 216 284L174 382C168 399 178 411 190 405L238 327L258 286L267 369L254 516L247 577H283L311 457L333 390H375L397 457L423 577H460L451 515L438 370L448 286L471 330L515 406C526 413 539 401 532 384L491 285C484 255 478 229 460 207C441 186 414 180 387 177L379 157C383 140 397 126 398 106C400 79 381 60 354 62Z" fill="#29242a" stroke="#8e7a80" stroke-width="2"/>
    <g class="body-structures"><path d="M282 222Q313 201 333 217L329 292Q300 322 276 292ZM378 217Q408 204 431 226L433 290Q400 314 382 288Z"/><path d="M286 337Q352 319 421 337M293 351Q351 338 415 351"/></g>
    <g data-route="arterial" class="systemic-arteries route-rose">
      <path d="M371 277L375 239Q376 220 358 219L347 220L346 351L329 417L290 530"/>
      <path d="M347 351L379 415L418 531M347 241L291 233L235 340L205 379M350 240L411 232L472 342L504 379M348 220L347 158L341 126"/>
      <path d="M347 284L346 319M324 429L307 478M389 432L406 479M271 267L249 309M435 272L458 311M347 180L345 143" marker-end="url(#${id}-arrow-rose)"/>
    </g>
    <g data-route="venous" class="systemic-veins route-slate">
      <path d="M318 533L344 424L324 352L327 292L335 267M392 534L365 421L324 352M227 390L258 343L307 253L332 257M483 389L450 342L405 254L370 255L338 264M368 127L368 193L335 260"/>
      <path d="M333 478L341 440M383 477L370 439M270 318L291 280M439 316L419 279M368 162L368 202M325 329L327 292" marker-end="url(#${id}-arrow-slate)"/>
    </g>
    <g class="tissue-beds">
      <path d="M341 126C328 114 351 97 362 110C375 120 354 137 368 127M205 379C192 385 202 402 215 399C227 399 217 386 227 390M504 379C516 384 507 401 495 400C484 399 494 386 483 389M290 530C276 544 299 555 311 544C322 536 306 525 318 533M418 531C431 545 408 554 399 544C389 535 403 527 392 534"/>
    </g>
    <path d="${shellPath}" transform="translate(289 221) scale(.18)" fill="#8e4c60" stroke="#d9a4aa" stroke-width="11"/>
    ${label(335, 269, 'R', 'body-heart-label', 'middle')}${label(366, 282, 'L', 'body-heart-label', 'middle')}
    ${leader('M346 321L233 278H40', 346, 321)}${label(40, 260, 'Aorta', 'svg-small')}
    ${leader('M367 198L495 169H680', 367, 198)}${label(680, 151, 'Venous return', 'svg-small', 'end')}
    ${leader('M416 547L500 513H680', 416, 547)}${label(680, 491, 'Tissue capillaries', 'svg-small', 'end')}
    ${label(40, 582, 'SCHEMATIC ROUTE', 'svg-micro')}${label(680, 582, 'NOT A ONE-BEAT TRANSIT', 'svg-micro', 'end')}`;
}

const descriptions: Record<string, string> = {
  chambers: 'An anterior cutaway. Right atrium and right ventricle are on the viewer left. Left atrium and left ventricle are on the viewer right. A visible septum divides the sides and the left ventricular wall is thicker.',
  signal: 'Dotted gold electrical activation begins at the SA node in the right atrium, reaches the AV node, then descends through the septum and branches through ventricular tissue. Blood routes are a separate arrowed layer.',
  return: 'Superior and inferior vena cava both enter the right atrium. Arrows continue through the tricuspid valve into the right ventricle. Slate denotes a route; actual oxygen-poor blood is dark red.',
  valves: 'Two separate valve-family plates. The atrioventricular plate shows open inlet leaflets with chordae and papillary supports. The alternate outflow plate shows three pocketlike cusps without chordae. These are comparisons, not all four valves opening together.',
  lungs: 'A schematic right ventricular outlet crosses the pulmonary valve into the pulmonary trunk, which branches to the anatomical right and left lungs. It carries oxygen-poor blood away from the heart.',
  exchange: 'An empty alveolar airspace is separated from capillary blood and red blood cells by a tissue barrier. Oxygen arrows point from air into blood. Carbon dioxide arrows point from blood toward air.',
  'pulmonary-return': 'Exposed posterior pulmonary veins enter the left atrium, then blood passes through the mitral valve into the left ventricle. The separate systemic return enters the right atrium.',
  walls: 'The left ventricular free wall is visibly thicker than the right ventricular free wall. The mitral inlet is distinct from the aortic outlet. No numerical thickness ratio or diagnostic measurement is shown.',
  systemic: 'A schematic body map. The left ventricle sends blood into the aorta and branching arteries. Tissue capillary beds link the outward branches to veins returning to the right atrium. There is no direct artery-to-vein shortcut.',
  overview: 'The fixed anterior heart cutaway carries two distinct layers: dotted electrical activation within heart tissue, and arrowed blood routes connecting chambers and great vessels. Neither layer represents a measured transit time.',
};

const defaultModes: Record<string, string> = { signal: 'electrical', return: 'body', valves: 'av', lungs: 'both', exchange: 'both', 'pulmonary-return': 'pulmonary', walls: 'left', systemic: 'both', overview: 'both', chambers: 'all' };

const mobileKeys: Record<string, string[]> = {
  chambers: ['RA — Right atrium: receives the body’s returning blood.', 'RV — Right ventricle: sends blood to the lungs.', 'LA — Left atrium: receives blood from the lungs.', 'LV — Left ventricle: sends blood to the body.', 'The septum divides the right and left sides.'],
  signal: ['SA node — in the right atrium; starts normal activation.', 'AV node — delays conduction before the ventricles.', 'Dotted gold: electrical activation within heart tissue.', 'Arrowed paths: blood transport, a separate process.'],
  return: ['Superior vena cava: return from the upper body.', 'Inferior vena cava: return from below the heart.', 'Both enter RA — the right atrium.', 'Tricuspid valve: RA → RV, the right ventricle.'],
  valves: ['Tricuspid: three leaflets; right atrium → right ventricle.', 'Mitral: two leaflets; left atrium → left ventricle.', 'Inlet leaflets have chordae and papillary supports.', 'Pulmonary and aortic outlets: pocketlike cusps, without chordae.'],
  lungs: ['Anatomical right lung appears on your left.', 'Anatomical left lung appears on your right.', 'Right ventricle → pulmonary valve → pulmonary trunk.', 'Pulmonary arteries carry blood away toward both lungs.'],
  exchange: ['Alveolar air is above the tissue barrier.', 'Capillary blood is below; blood cells stay inside it.', 'Solid O₂ arrow: oxygen moves into blood.', 'Dashed CO₂ arrow: carbon dioxide moves toward air.'],
  'pulmonary-return': ['Pulmonary veins enter LA — the left atrium.', 'Posterior entries are exposed in this cutaway.', 'Mitral valve: LA → LV, the left ventricle.', 'The separate body return enters RA — the right atrium.'],
  walls: ['RV — Right ventricular wall: thinner.', 'LV — Left ventricular wall: thicker.', 'Aortic outlet: left ventricle → aorta.', 'This is a qualitative illustration, not a measurement.'],
  systemic: ['Rose arrows: aorta and arteries travel outward.', 'Gold loops: tissue capillaries link arteries and veins.', 'Slate arrows: veins return to the right atrium.', 'This route is not a one-beat transit time.'],
  overview: ['Anatomical right appears on your left.', 'Dotted gold marks show the electrical sequence.', 'Arrowed paths show blood transport.', 'The two layers have different meanings and timescales.'],
};

/** Full-size selectable HTML keys replace cramped callouts on narrow screens. */
export function renderDiagramKey(kind: string): string {
  return `<ul class="diagram-key" aria-label="Diagram key">${(mobileKeys[kind] ?? mobileKeys.chambers).map(text => `<li>${text}</li>`).join('')}</ul>`;
}

export function renderDiagram(kind: string, id: string, mode?: string): string {
  const prefix = `atlas-${clean(id)}`;
  const safeKind = descriptions[kind] ? kind : 'chambers';
  const picture = safeKind === 'valves' ? valves(prefix) : safeKind === 'lungs' ? lungs(prefix) : safeKind === 'exchange' ? exchange(prefix) : safeKind === 'systemic' ? systemic(prefix) : commonHeart(prefix, safeKind);
  return `<svg class="anatomy-svg diagram--${safeKind}" data-kind="${safeKind}" data-mode="${clean(mode ?? defaultModes[safeKind])}" viewBox="0 0 720 620" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="${prefix}-title ${prefix}-description">
    <title id="${prefix}-title">${safeKind === 'exchange' ? 'Alveolar gas exchange' : safeKind === 'systemic' ? 'Systemic circulation' : 'Anatomical atlas: ' + safeKind.replace(/-/g, ' ')}</title>
    <desc id="${prefix}-description">${descriptions[safeKind]}</desc>
    ${defs(prefix)}${picture}
  </svg>${renderDiagramKey(safeKind)}`;
}

/** Ten small, unique anatomical anchors for reversible chapter handoffs. */
export function renderTransitionAnchor(index: number, id: string): string {
  const p = `anchor-${clean(id)}`;
  const heart = `<path d="${shellPath}" fill="url(#${p}-muscle)" stroke="#d399a0" stroke-width="2"/>`;
  const ra = '<path d="M217 191C220 171 257 158 283 177C303 193 306 219 302 244L290 270C267 290 230 275 219 251C207 231 207 208 217 191Z" fill="#351d29" stroke="#d5a5a8" stroke-width="3"/>';
  const section = `${vesselBase(p)}${heartShell(p)}`;
  // TR05 keeps the complete outlet attached to its valve root. Only the flow
  // emphasis advances; clipping vessel geometry would reveal detached pieces.
  const pulmonaryOutflow = 'M338 358V247Q338 207 375 186L474 153M338 247L260 197L185 189';
  const common = [
    heart,
    section,
    section,
    '<path d="M222 278Q256 298 284 278" fill="none" stroke="#e3c5b6" stroke-width="5"/>',
    `<path d="${pulmonaryOutflow}" fill="none" stroke="#5e8391" stroke-width="32" stroke-linecap="round" stroke-linejoin="round"/><path d="${pulmonaryOutflow}" fill="none" stroke="#293d47" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/><ellipse cx="338" cy="358" rx="58" ry="48" fill="none" stroke="#dfbfb0" stroke-width="5"/><path d="M329 303L338 288L347 303" fill="none" stroke="#b0d3dd" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>`,
    '<circle cx="279" cy="338" r="30" fill="none" stroke="#d2b180" stroke-width="2"/>',
    '<path d="M270 282L310 286L310 348L270 343" fill="none" stroke="#d7a8a8" stroke-width="3"/>',
    section,
    section,
    section,
  ];
  const pictures = [
    `<g class="anchor-source"><path d="M370 190L414 522" stroke="#d7bb9e" stroke-width="2" stroke-dasharray="4 6"/></g><g class="anchor-target">${heartShell(p, false)}</g><path class="anchor-trace" d="M450 268C486 312 480 396 422 498"/>`,
    `<g class="anchor-source"><path d="M218 191Q246 166 283 181" fill="none" stroke="#d9b1a1" stroke-width="3"/></g><g class="anchor-target">${electricalRoutes()}</g><circle class="anchor-trace" cx="234" cy="181" r="27"/>`,
    `<g class="anchor-source">${electricalRoutes()}</g><g class="anchor-target"><path d="M208 91L211 186L244 222M180 425C175 365 190 293 218 254" class="route-slate" marker-end="url(#${p}-arrow-slate)"/></g><path class="anchor-trace" d="M217 190Q248 162 284 184"/>`,
    `<g class="anchor-source">${heart}${ra}<path d="M260 242V284L279 333" class="route-slate"/></g><g class="anchor-target"><ellipse cx="280" cy="294" rx="86" ry="29" fill="#291721" stroke="#e0bdb4" stroke-width="8"/><path d="M201 289L246 353L258 311M359 289L313 352L301 311" fill="#d3ada6"/><path d="M246 353L263 422M258 311L263 422M313 352L303 426M301 311L303 426" class="valve-chordae"/></g><ellipse class="anchor-trace" cx="280" cy="294" rx="95" ry="37"/>`,
    `<g class="anchor-source"><ellipse cx="338" cy="358" rx="48" ry="38" fill="none" stroke="#e0c7b6" stroke-width="2"/></g><g class="anchor-target"><path d="${pulmonaryOutflow}" fill="none" stroke="#7ba6b5" stroke-width="18" stroke-linecap="round" stroke-linejoin="round" opacity=".38"/></g><path class="anchor-trace" d="M338 358V247Q338 207 375 186L474 153" pathLength="100" style="stroke:#b0d3dd;stroke-width:4.5"/><path class="anchor-trace" d="M338 358V247L260 197L185 189" pathLength="100" style="stroke:#b0d3dd;stroke-width:4.5"/>`,
    `<g class="anchor-source"><path d="M70 338H202L273 257M202 338L275 412M202 338H310" fill="none" stroke="#8e5365" stroke-width="29"/><path d="M74 338H270" class="route-slate" marker-end="url(#${p}-arrow-slate)"/></g><g class="anchor-target">${exchange(p)}</g><path class="anchor-trace" d="M279 307L378 226M279 369L378 414"/>`,
    `<g class="anchor-source"><path d="M65 279Q193 243 300 284L300 347Q192 310 65 344Z" fill="url(#${p}-blood)" stroke="#d5a2a9" stroke-width="3"/>${cell(p,151,300,-8)}</g><g class="anchor-target"><path d="M305 315L455 301L518 326" fill="none" stroke="#b76d7c" stroke-width="27"/><path d="M480 257C548 223 594 277 573 344C555 391 506 378 484 345Z" fill="#422330" stroke="#dca9ac" stroke-width="3"/></g><path class="anchor-trace" d="M104 309H281M320 315H487"/>`,
    `<g class="anchor-source"><path d="M414 239L414 277L411 327" class="route-rose" marker-end="url(#${p}-arrow-rose)"/></g><g class="anchor-target"><path d="M446 271C483 283 503 310 499 356C494 410 459 483 419 525L406 534L390 499C431 452 462 405 464 354C466 322 452 304 435 298Z" fill="#b57580" stroke="#edbfba" stroke-width="3"/></g><path class="anchor-trace" d="M376 272Q410 289 446 272"/>`,
    `<g class="anchor-source"><path d="M390 395L366 295" class="route-rose" marker-end="url(#${p}-arrow-rose)"/></g><g class="anchor-target"><path d="M369 348L349 211Q336 143 380 117Q429 100 455 153L455 351L508 463M455 351L424 466M455 220L531 249M455 220L393 249" fill="none" stroke="#cf9299" stroke-width="13"/></g><path class="anchor-trace" d="M369 348L349 211Q336 143 380 117Q429 100 455 153"/>`,
    `<g class="anchor-source"><path d="M113 522L161 415L180 293L215 215M166 98L193 173L215 215" fill="none" stroke="#8caab4" stroke-width="16"/></g><g class="anchor-target">${electricalRoutes()}<path d="M208 91L211 186L244 222" class="route-slate" marker-end="url(#${p}-arrow-slate)"/></g><path class="anchor-trace" d="M166 98L193 173L237 224"/>`,
  ];
  const safe = Math.max(0, Math.min(9, Math.trunc(index)));
  return `<svg class="transition-anchor transition-anchor--${safe + 1}" viewBox="0 0 720 620" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">${defs(p)}<g class="anchor-common">${common[safe]}</g>${pictures[safe]}</svg>`;
}
