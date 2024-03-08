import { Client } from '@googlemaps/google-maps-services-js';

export class GoogleMapsUtils {

    private static mapsUtils: GoogleMapsUtils | null;

    private apiKey: string;
    private client: Client;

    static getMaps( apiKey?: string): GoogleMapsUtils {
        if ( this.mapsUtils === null && apiKey === null ) throw new Error("API KEY NOT SET, API KEY NEEDED");

        if ( this.mapsUtils ) return this.mapsUtils;

        this.mapsUtils = new GoogleMapsUtils( apiKey! );

        return this.mapsUtils;
    }

    private constructor( apiKey: string ) {
        this.apiKey = apiKey;
        this.client = new Client({});
    }

    async getLatitudeLongitude( address: string ) {
        let result = await this.client.geocode({
            params: {
                key: this.apiKey,
                address
            }
        });

        return result.data.results[0].geometry.location
    }
}
