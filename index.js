const uuid = require("uuid/v4");
const axios = require("axios");
const fs = require("fs");

const nodes = [];
const edges = [];

// RESPONSE ------------------------------------------------------------

// from:

// "flag": "EDGE_CASE",
// "id": "58063198-5c61-4ec4-ad1f-6e06624108a6",
// "img": "https://planx-infrastructure.s3.amazonaws.com/uploads/c4266891-a83b-4961-aa33-0bc981669108_4.1_rear-extensions__SemiD-Rear_1storey.svg",
// "text": "Yes"
// "type": "Response",
// "val": "true",

// to:

// flag: types.maybe(types.safeReference(Flag)),
// id: types.identifier,
// img: types.maybe(types.string),
// passportValue: types.maybe(types.string),
// text: types.string,
// type: types.string,

// STATEMENT ------------------------------------------------------------

// from:

// "id": "7eff8b49-41a1-40a0-bccd-56ca45f27065",
// "info": "Rear extensions with any kind of verandah, balcony or raised platform that is higher than 30cm above the ground will require planning permission. GPDO 2015 S.2 P.1 A.1 (k)(i) ",
// "notes": ""
// "text": "The extension will have",
// "type": "Statement",
// "val": "extension.storeys",

// to:

// id: types.identifier,
// img: types.maybe(types.string),
// moreInfo: types.maybe(
//   types.model({
//     body: types.maybe(types.string),
//     title: types.maybe(types.string),
//   })
// ),
// text: types.string,
// type: NodeTypes.statement,
// parent: types.maybe(types.late(() => types.reference(Statement))),
// passportField: types.maybe(types.string),
// policy: types.maybe(
//   types.model({
//     text: types.maybe(types.string),
//   })
// ),

function parse(type, node) {
  switch (type) {
    case "Response":
      return {
        flag: node.flag,
        id: node.id,
        img: node.img,
        passportValue: node.val,
        text: node.text,
        type: "response"
      };
    case "Statement":
      return {
        id: node.id,
        img: node.img,
        moreInfo: {
          body: node.body
        },
        passportField: node.val,
        text: node.text,
        type: "statement"
      };
    default:
      break;
  }
}

function parseNode(node, parentId) {
  // RESPONSE:
  // val to passportValue

  // STATEMENT:
  // from info to moreInfo.body
  // from notes to ???
  // from val to passportField

  nodes.push(
    parse(node.t, {
      id: node.id,
      type: node.t,
      ...node.d
    })
  );

  edges.push({
    id: uuid(),
    src: parentId,
    tgt: node.id
  });

  node.c.forEach(child => {
    parseNode(child, node.id);
  });
}

function buildFlow({ id, nodes, edges }) {
  return {
    type: "flow",
    id,
    nodes,
    edges,
    text: id,
    flags: [
      {
        id: "MISSING_INFO",
        name: "Missing info",
        description:
          "Before your project can be assessed, there is some key information you’ll need to find out. If you do not know this information, your council may be able to help you find it out.",
        color: "lightgrey",
        icon: "check"
      },
      {
        id: "LIKELY_FAIL",
        name: "Likely refusal",
        description:
          "Your project will require planning permission. Based on the information you have provided so far, it does not comply with local planning policies and guidance and is therefore quite likely to be refused, except in unusual circumstances.",
        color: "red",
        icon: "warning"
      },
      {
        id: "EDGE_CASE",
        name: "Advice recommended",
        description:
          "Your project will require planning permission. In order for it to be given planning approval, it will have to address certain key issues. We recommend a pre-application meeting to discuss this further with a planning officer, however if you prefer, you can submit a planning application without seeking further advice.",
        color: "orange",
        icon: "info"
      },
      {
        id: "LIKELY_PASS",
        name: "Likely approval",
        description:
          "Your project will require planning permission. Based on the information you have provided so far, it appears to comply with local planning policies and guidance, so your application stands a better chance of being approved.",
        color: "green",
        icon: "info"
      },
      {
        id: "PRIOR_APPROVAL",
        name: "Prior consent",
        description:
          "Based on the information you have provided, your project falls into the category of prior approval. This means you do not need planning permission, provided your planning authority does not raise any objections – often this will be established by consulting with your neighbours. If any objections are raised, your planning authority will determine whether those objections are reasonable.",
        color: "#888",
        icon: "info"
      },
      {
        id: "NO_APP_REQUIRED",
        name: "No application needed",
        description:
          "Based on the information you have provided your project falls into the category of ‘permitted development’. This means you do not need planning permission to proceed. However, you may want to get a ‘certificate of lawful development’ to provide you and future buyers with legal security.",
        color: "grey",
        icon: "check"
      }
    ]
  };
}

async function convert(id) {
  const url = `https://planx-backend.herokuapp.com/api/v1/flows/${id}`;
  const {
    data: { data }
  } = await axios.get(url);

  data.c.forEach(node => parseNode(node, id));

  fs.writeFileSync(
    `out/${id}.json`,
    JSON.stringify(buildFlow({ id, nodes, edges }), null, 2)
  );
}

convert("6032807f-d9d4-4a3f-925a-bd5b0e595e94");
