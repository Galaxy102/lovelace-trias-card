// TRIAS Card

class TriasCard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({
            mode: 'open'
        });
    }

    /**
     * Extracts minutes from HH:MM:SS duration string
     * @param {string} duration - Duration string in HH:MM:SS format
     * @returns {number|null} Minutes value or null if invalid
     *
     * AI generated using Phind
     */
    static extractMinutes(duration) {
        // Validate format
        if (!/^\d{2}:\d{2}:\d{2}$/.test(duration)) {
            return null;
        }

        // Extract middle part (minutes)
        const minutes = parseInt(duration.split(':')[1]);

        // Validate minutes range
        return !isNaN(minutes) && minutes <= 59 ? minutes : null;
    }

    /**
     * Get colors for means of transport
     * @param {string} mean - Mean of transport, see https://github.com/VDVde/TRIAS/blob/f7bad9cd499ba48f2459247a0040c6cb5323f2a3/Trias_ModesSupport.xsd#L124
     * @returns {string|null} color or null if invalid
     */
    static meanToColor(mean) {
        switch (mean) {
            case 'unknown':
                return '#101010'
            case 'air':
                return '#007399'
            case 'bus':
                return '#a5027d'
            case 'trolleyBus':
                return '#65014c'
            case 'tram':
                return '#d82020'
            case 'coach':
                return '#00586a'
            case 'rail':
                return '#4d4d4d'
            case 'intercityRail':
                return '#646973'
            case 'urbanRail':
                return '#008d4f'
            case 'metro':
                return '#0065ae'
            case 'water':
                return '#00a5df'
            case 'cableway':
                return '#95c11f'
            case 'funicular':
                return '#95c11f'
            case 'taxi':
                return '#ffcc00'
        }
    }

    /* This is called every time sensor is updated */
    set hass(hass) {

        const config = this.config;
        const maxEntries = config.max_entries || 10;
        const showStopName = config.show_stop_name || (config.show_stop_name === undefined);
        const entityIds = config.entity ? [config.entity] : config.entities || [];
        // const showCancelled = config.show_cancelled || (config.show_cancelled === undefined);
        const showDelay = config.show_delay || (config.show_delay === undefined);
        const showTimetableTime = config.show_timetable_time || (config.show_timetable_time === undefined);
        const showEstimatedTime = config.show_estimated_time || (config.show_estimated_time !== undefined);

        let content = "";

        for (const entityId of entityIds) {
            const entity = hass.states[entityId];
            if (!entity) {
                throw new Error("Entity State Unavailable");
            }

            if (showStopName) {
                content += `<div class="stop">${entity.attributes.friendly_name}</div>`;
            }

            console.log(entity)

            const timetable = entity.attributes.departures.slice(0, maxEntries).map((departure) => {
                const delay = departure.CurrentDelay === null ? `` : TriasCard.extractMinutes(departure.CurrentDelay);
                const delayDiv = delay > 0 ? `<div class="delay delay-pos">+${delay}</div>` : `<div class="delay delay-neg">${delay === 0 ? '+0' : delay}</div>`;
                const timetabledTimestamp = new Date(departure.TimetabledTime).getTime();
                const estimatedTimestamp = new Date(departure.EstimatedTime).getTime();

                return `<div class="departure">
                    <div class="line">
                        <div class="line-icon" style="background-color: ${TriasCard.meanToColor(departure.mode)}">${departure.PublishedLineName}</div>
                    </div>
                    <div class="direction">${departure.DestinationText}</div>
                    <div class="time">${showTimetableTime ? timetabledTimestamp : ''}${showEstimatedTime ? estimatedTimestamp : ''}${showDelay ? delayDiv : ''}</div>
                </div>`
            });

            content += `<div class="departures">` + timetable.join("\n") + `</div>`;
        }

        this.shadowRoot.getElementById('container').innerHTML = content;
    }

    /* This is called only when config is updated */
    setConfig(config) {
        const root = this.shadowRoot;
        if (root.lastChild) root.removeChild(root.lastChild);

        this.config = config;

        const card = document.createElement('ha-card');
        const content = document.createElement('div');
        const style = document.createElement('style');

        style.textContent = `
            .container {
                padding: 10px;
                font-size: 130%;
                line-height: 1.5em;
            }
            .stop {
                opacity: 0.6;
                font-weight: 400;
                width: 100%;
                text-align: left;
                padding: 10px 10px 5px 5px;
            }      
            .departures {
                width: 100%;
                font-weight: 400;
                line-height: 1.5em;
                padding-bottom: 20px;
            }
            .departure {
                padding-top: 10px;
                display: flex;
                flex-direction: row;
                flex-wrap: nowrap;
                align-items: flex-start;
                gap: 20px;
            }
            .departure-cancelled {
                text-decoration: line-through;
                filter: grayscale(50%);
                padding-top: 10px;
                display: flex;
                flex-direction: row;
                flex-wrap: nowrap;
                align-items: flex-start;
                gap: 20px;
            }
            .line {
                min-width: 70px;
                text-align: right;
            }
            .line-icon {
                display: inline-block;
                border-radius: 20px;
                padding: 7px 10px 5px;
                font-size: 120%;
                font-weight: 700;
                line-height: 1em;
                color: #FFFFFF;
                text-align: center;
            }
            .direction {
                align-self: center;
                flex-grow: 1;
            }
            .time {
                align-self: flex-start;
                font-weight: 700;
                line-height: 2em;
                padding-right: 10px;
                display: flex;
            }
            .delay {
               line-height: 2em;
               font-size: 70%;
               text-align: right;
               min-width: 2ch;
            }
            .delay-pos {
               color: #8B0000;
            }
            .delay-neg {
               color: #006400;
            }
            .relative-time {
               font-style: italic;
            }
        `;

        content.id = "container";
        content.className = "container";
        card.header = config.title;
        card.appendChild(style);
        card.appendChild(content);

        root.appendChild(card);
    }

    // The height of the card.
    getCardSize() {
        return 5;
    }
}

customElements.define('trias-card', TriasCard);
