'use client';
import type {ImgHTMLAttributes} from 'react';
import {BASE_CARD_BACK,HALLOWEEN_CARD_BACK} from '../config/event';
import {useHalloweenEvent} from '../use-halloween-event';
export default function CardBackImage({keepHalloween=false,...props}:Omit<ImgHTMLAttributes<HTMLImageElement>,'src'>&{keepHalloween?:boolean}){const active=useHalloweenEvent();return <img {...props} src={active||keepHalloween?HALLOWEEN_CARD_BACK:BASE_CARD_BACK}/>;}
