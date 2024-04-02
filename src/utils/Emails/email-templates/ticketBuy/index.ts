import fs from 'fs';
import path from 'path'

export type TicketBuyProps = {
    name: string;
    eventName: string;
    ticketLink: string;
    qrCode: string;
    email: string;
}

export const ticketBuy = ( props: TicketBuyProps ) => {
    let content = fs.readFileSync( path.resolve(__dirname, 'index.html'), 'utf8' );

    for ( let key in props ) content = content.replaceAll( `{{${key}}}`, props[ key as keyof TicketBuyProps ] + "" );

    return content;
}
