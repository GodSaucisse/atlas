import Atelier from "./atelier";
import {authorize,HttpError} from './server';
import {redirect} from 'next/navigation';
export const dynamic="force-dynamic";
export default async function Home(){try{await authorize();}catch(error){if(error instanceof HttpError&&error.status===401)redirect('/signin-with-chatgpt?return_to=/');redirect('/jeu');}return <Atelier/>;}
