import axios from "axios";

export class RadarMapsUtils {

    private static mapsUtils: RadarMapsUtils | null;

    private apiKey: string;

    static getMaps( apiKey?: string): RadarMapsUtils {
        if ( this.mapsUtils === null && apiKey === null ) throw new Error("API KEY NOT SET, API KEY NEEDED");

        if ( this.mapsUtils ) return this.mapsUtils;

        this.mapsUtils = new RadarMapsUtils( apiKey! );

        return this.mapsUtils;
    }

    private constructor( apiKey: string ) {
        this.apiKey = apiKey;
    }

    async getLatitudeLongitude( address: string ) {
        try {
            const encodedAddress = encodeURIComponent( address );

            const url = `https://api.radar.io/v1/geocode/forward?query=${encodedAddress}&layers=address`;

            const response = await axios.get( url, {
                headers: {
                    Authorization: this.apiKey
                }
            });

            const results = response.data.addresses;

            if ( results && results.length > 0 ) {
                return {
                    lat: results[0].latitude,
                    lng: results[0].longitude,
                    timezone: results[0].timeZone.id
                }
            }

            return null;
        }catch( error ) {
            console.error("Error fetching geocode data:", error);
            return null;
        }
    }
}
