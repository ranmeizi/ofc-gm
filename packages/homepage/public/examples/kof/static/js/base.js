import { GameMap } from './game_map/base.js';
import { OfficeFighter } from './player/office.js';

class KOF {
    constructor(id, options = {}) {
        this.$kof = $('#' + id);
        this.game_map = new GameMap(this);
        const localId = options.localId ?? 0;
        this.game_map.controller.local_id = localId;

        const skins = options.skins || ['clerk', 'manager'];
        this.players = [
            new OfficeFighter(this, {
                id: 0,
                x: 200,
                y: 0,
                width: 120,
                height: 200,
                color: '#2060ff',
                skin: skins[0],
            }),
            new OfficeFighter(this, {
                id: 1,
                x: 900,
                y: 0,
                width: 120,
                height: 200,
                color: '#c02020',
                skin: skins[1],
            }),
        ];
    }
}

export { KOF };
