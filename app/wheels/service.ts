import {env} from 'cloudflare:workers';
import {db} from '../server';
import {catalogAsset} from '../catalog-assets';
import {WheelService} from './engine';
export function wheels(){return new WheelService(db(),async key=>!!catalogAsset(key)||!!(await env.BUCKET?.head(key)));}
