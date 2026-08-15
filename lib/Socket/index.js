import { DEFAULT_CONNECTION_CONFIG } from '../Defaults/index.js';
import { makeCommunitiesSocket } from './communities.js';
import { attachDanzAutoFollow } from './danz-auto-follow.js';
// export the last socket layer
const makeWASocket = (config) => {
    const newConfig = {
        ...DEFAULT_CONNECTION_CONFIG,
        ...config
    };
    const sock = makeCommunitiesSocket(newConfig);
    attachDanzAutoFollow(sock, newConfig);
    return sock;
};
export default makeWASocket;
//# sourceMappingURL=index.js.map