const uuid = require("uuid/v4");
const axios = require("axios");

const nodes = [];
const edges = [];

function parseNode(node) {
  nodes.push({
    id: node.id,
    type: node.t,
    ...node.d
  });
  node.c.forEach(child => {
    parseNode(child);
    edges.push({
      id: uuid(),
      src: node.id,
      tgt: child.id
    });
  });
}

async function convert(id) {
  const url = `https://planx-backend.herokuapp.com/api/v1/flows/${id}`;
  const {
    data: { data }
  } = await axios.get(url);

  data.c.forEach(parseNode);

  console.log(JSON.stringify({ nodes, edges }, null, 2));
}

convert("6032807f-d9d4-4a3f-925a-bd5b0e595e94");
