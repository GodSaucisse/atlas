/** Account allowlist from runtime configuration; never grants workshop roles. */
export function isWorkshopPlayer(email:string,ownerEmail:string,additionalEmails:string=""){const value=email.trim().toLowerCase();return !!value&&[ownerEmail,...additionalEmails.split(",")].some(allowed=>allowed.trim().toLowerCase()===value)}
