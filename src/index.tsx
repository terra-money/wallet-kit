import { Buffer } from "buffer";
//@ts-ignore
window.global = window

window.Buffer = Buffer;

import('./main')
//import('./polyfills/polyfills').then(() => import('./main'));
