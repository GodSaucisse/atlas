import {env} from 'cloudflare:workers';
import {db} from '../server';
import {catalogAsset} from '../catalog-assets';
import {LotteryService} from './engine';
export function lottery(){return new LotteryService(db(),async key=>!!catalogAsset(key)||!!(await env.BUCKET?.head(key)));}
