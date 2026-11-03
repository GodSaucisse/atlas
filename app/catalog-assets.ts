import oct31Provided from './content/oct31-provided-import.json';
import oct30Provided from './content/oct30-provided-import.json';
import comicsEdition from './content/comics-edition-import.json';
import championJaylen from './content/champion-jaylen-import.json';
import faunaHistory from './content/fauna-history-import.json';
import newImages from './content/animals-fiction-images-20261029.json';
import halloweenCharacters from './content/halloween-walter-rick-import.json';
import animals from './content/animal-christian-drafts-20261028.json';
import research from './content/research-drafts-20261028.json';
import remaining from './content/remaining-supreme-import.json';
import editions from './content/special-edition-import.json';
import halloween from './content/halloween-import.json';
import october from './content/october-supreme-import.json';
import pierre from './content/saint-pierre-import.json';
export const CATALOG_ASSETS=[...editions,...halloween,...october,...pierre,...remaining,...research,...animals,...halloweenCharacters,...newImages,...faunaHistory,...championJaylen,...comicsEdition,...oct30Provided,...oct31Provided];
export function catalogAsset(key:string){return CATALOG_ASSETS.find(item=>item.imageKey===key);}
