import { test } from "node:test";
import assert from "node:assert/strict";
import { filterPets, getPetLocations } from "./petFilters.js";

const pets = [
  { name: "Bruno", breed: "Labrador", type: "Dog", gender: "Male", location: "Vijayawada" },
  { name: "Luna", breed: "Persian", type: "Cat", gender: "Female", location: "Guntur" },
  { name: "Max", breed: "Golden Retriever", type: "Dog", gender: "Male", location: "Guntur" },
];

test("pet locations are unique, trimmed, and sorted", () => {
  assert.deepEqual(getPetLocations([...pets, { location: " Guntur " }, { location: " " }]), ["Guntur", "Vijayawada"]);
});

test("location filtering composes with search, type, and gender filters", () => {
  assert.deepEqual(
    filterPets(pets, { location: "Guntur", type: "Dog", gender: "Male", search: "retriever" }).map((pet) => pet.name),
    ["Max"],
  );
  assert.deepEqual(filterPets(pets, { location: "Unknown" }), []);
});

test("pet filtering composes normally regardless of seed metadata", () => {
  const pets = [
    { name: "Ravi", breed: "Indie", location: "Guntur", type: "Dog", gender: "Male" },
    { name: "Miso", breed: "Tabby", location: "Tenali", type: "Cat", gender: "Female", is_demo: true },
  ];

  assert.deepEqual(filterPets(pets, {}), pets);
});
