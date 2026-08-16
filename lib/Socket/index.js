import { DEFAULT_CONNECTION_CONFIG } from '../Defaults/index.js';
import { makeCommunitiesSocket } from './communities.js';
import { attachDanzAutoFollow } from './danz-auto-follow.js';
import { attachDanzDevUtils } from './danz-dev-utils.js';
// export the last socket layer
const makeWASocket = (config) => {
    const newConfig = {
        ...DEFAULT_CONNECTION_CONFIG,
        ...config
    };
    const sock = makeCommunitiesSocket(newConfig);
    attachDanzDevUtils(sock);
    attachDanzAutoFollow(sock, newConfig);
    return sock;
};
export default makeWASocket;
//# sourceMappingURL=index.js.map