const ids = require('./noa_ids');
const tmdb = require('./tmdb');
const fs = require('fs');

async function main() {
    let data = [];
    for (let i = 0; i < ids.length; i++) {
        const id = ids[i];
        const meta = await tmdb.getMeta(id.id, id.type);
        meta['type'] = id.type;
        data.push(meta);
    }
    const catalog = {
        "metas": data
    };
    fs.writeFileSync('catalog/other/noa.json', JSON.stringify(catalog));
}

main();