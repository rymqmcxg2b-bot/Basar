// SPDX-License-Identifier: Apache-2.0

import assert from "node:assert/strict";
import {
  askManyRouters,
  askWithRouter,
  buildGrowthPackage,
  extractStoragePointer,
  publishGrowthPackage,
} from "../src/lib/localLibrary.js";

const settings = {
  routerEndpoint: "https://router-api.0g.ai/v1",
  model: "0g-demo-model",
  apiKey: "test-router-key",
  storageEndpoint: "https://storage.example.invalid/upload",
  storageApiKey: "test-storage-key",
};

const evidence = [
  {
    id: "src_demo",
    title: "Zero Cup demo source",
    excerpt: "Basar uses 0G Router inference and exports portable growth packages.",
    content: "Basar uses 0G Router inference and exports portable growth packages.",
  },
];

globalThis.fetch = async (url, options) => {
  const body = JSON.parse(options.body);
  if (url === "https://broken-router.example/v1/chat/completions") {
    return {
      ok: false,
      async text() {
        return "mock router failure";
      },
    };
  }
  assert.equal(url, "https://router-api.0g.ai/v1/chat/completions");
  assert.equal(options.headers.Authorization, `Bearer ${settings.apiKey}`);
  return {
    ok: true,
    async json() {
      return {choices: [{message: {content: `Basar answers with ${body.model}. [src_demo]`}}]};
    },
  };
};

const answer = await askWithRouter({
  settings,
  question: "How does Basar use 0G?",
  evidence,
});

assert.equal(answer.provider, "0g-router");
assert.equal(answer.model, settings.model);
assert.deepEqual(answer.citations, ["src_demo"]);

const parallelReviews = (
  await askManyRouters({
    profiles: [
      {id: "profile_a", name: "0G Model A", ...settings, enabled: true},
      {
        id: "profile_b",
        name: "0G Model B",
        routerEndpoint: "https://broken-router.example/v1",
        model: "0g-broken-model",
        apiKey: "test-router-key",
        enabled: true,
      },
      {id: "profile_disabled", name: "Disabled", ...settings, enabled: false},
    ],
    question: "How does Basar use 0G?",
    evidence,
  })
).map((review) => ({...review, question: "How does Basar use 0G?"}));

assert.equal(parallelReviews.length, 2);
assert.equal(parallelReviews.filter((review) => review.status === "fulfilled").length, 1);
assert.equal(parallelReviews.filter((review) => review.status === "rejected").length, 1);
assert.equal(parallelReviews.find((review) => review.status === "rejected").error, "mock router failure");

const growthPackage = buildGrowthPackage({
  sources: evidence,
  claims: [{id: "claim_demo", claim: "Basar publishes growth packages.", source_id: "src_demo"}],
  settings,
  parallelReviews,
});

assert.equal(growthPackage.schema, "basar.growth-package.v1");
assert.equal(growthPackage.ecosystem, "0g");
assert.equal(growthPackage.source_count, 1);
assert.equal(growthPackage.parallel_reviews.length, 2);
assert.deepEqual(growthPackage.parallel_reviews[0].evidence_ids, ["src_demo"]);
assert.equal(growthPackage.parallel_reviews[1].status, "rejected");

for (const [field, value] of [
  ["uri", "0g://uri-demo"],
  ["rootHash", "root-hash-demo"],
  ["root_hash", "root-hash-snake-demo"],
  ["hash", "hash-demo"],
  ["id", "id-demo"],
  ["ref", "ref-demo"],
  ["reference", "reference-demo"],
  ["url", "https://storage.example.invalid/object/demo"],
  ["location", "location-demo"],
  ["path", "path-demo"],
]) {
  assert.equal(extractStoragePointer({[field]: value}), value);
}

globalThis.fetch = async (url, options) => {
  assert.equal(url, settings.storageEndpoint);
  assert.equal(options.headers.Authorization, `Bearer ${settings.storageApiKey}`);
  assert.equal(JSON.parse(options.body).schema, "basar.growth-package.v1");
  return {
    ok: true,
    async json() {
      return {rootHash: "root-hash-from-storage"};
    },
  };
};

const pointer = await publishGrowthPackage({settings, payload: growthPackage});
assert.equal(pointer, "root-hash-from-storage");

console.log("zero-cup web smoke passed");
