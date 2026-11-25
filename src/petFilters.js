export function getPetLocations(pets) {
  return [...new Set(
    pets
      .map((pet) => pet.location?.trim())
      .filter(Boolean),
  )].sort((a, b) => a.localeCompare(b));
}

export function filterPets(pets, { search = "", type = "", gender = "", location = "" } = {}) {
  const query = search.trim().toLowerCase();
  const selectedLocation = location.trim().toLowerCase();
  return pets.filter((pet) => {
    const matchesText = !query || [pet.name, pet.breed, pet.location]
      .some((value) => value?.toLowerCase().includes(query));
    const matchesLocation = !selectedLocation || pet.location?.trim().toLowerCase() === selectedLocation;
    return matchesText
      && (!type || pet.type === type)
      && (!gender || pet.gender === gender)
      && matchesLocation;
  });
}
