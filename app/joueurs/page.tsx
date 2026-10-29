import PlayersAdmin from './players-admin';
import {authorize} from '../server';
import {redirect} from 'next/navigation';
export const dynamic='force-dynamic';
export default async function Page(){try{await authorize();}catch{redirect('/jeu');}return <PlayersAdmin/>;}
