begin;

update public.pets as p
set image_url = images.image_url
from (values
  ('00000000-0000-4000-8000-000000000001'::uuid, '/pets/bruno-labrador.jpg'),
  ('00000000-0000-4000-8000-000000000002'::uuid, '/pets/luna-persian.jpg'),
  ('00000000-0000-4000-8000-000000000003'::uuid, '/pets/max-golden-retriever.jpg'),
  ('00000000-0000-4000-8000-000000000004'::uuid, '/pets/bella-beagle.jpg'),
  ('00000000-0000-4000-8000-000000000005'::uuid, '/pets/milo-domestic-shorthair.jpg'),
  ('00000000-0000-4000-8000-000000000006'::uuid, '/pets/coco-netherland-dwarf.jpg'),
  ('00000000-0000-4000-8000-000000000007'::uuid, '/pets/rocky-german-shepherd.jpg'),
  ('00000000-0000-4000-8000-000000000008'::uuid, '/pets/daisy-indie.jpg'),
  ('00000000-0000-4000-8000-000000000101'::uuid, '/pets/asha-indie.jpg'),
  ('00000000-0000-4000-8000-000000000102'::uuid, '/pets/chintu-indian-spitz.jpg'),
  ('00000000-0000-4000-8000-000000000103'::uuid, '/pets/pepper-pariah-mix.jpg'),
  ('00000000-0000-4000-8000-000000000104'::uuid, '/pets/simba-boxer.jpg'),
  ('00000000-0000-4000-8000-000000000105'::uuid, '/pets/kaju-shih-tzu.jpg'),
  ('00000000-0000-4000-8000-000000000106'::uuid, '/pets/oreo-pug.jpg'),
  ('00000000-0000-4000-8000-000000000107'::uuid, '/pets/tara-beagle.jpg'),
  ('00000000-0000-4000-8000-000000000108'::uuid, '/pets/arlo-golden.jpg'),
  ('00000000-0000-4000-8000-000000000109'::uuid, '/pets/moti-indie.jpg'),
  ('00000000-0000-4000-8000-000000000110'::uuid, '/pets/zoya-husky.jpg'),
  ('00000000-0000-4000-8000-000000000111'::uuid, '/pets/duke-doberman.jpg'),
  ('00000000-0000-4000-8000-000000000112'::uuid, '/pets/piku-cocker-spaniel.jpg'),
  ('00000000-0000-4000-8000-000000000113'::uuid, '/pets/rusty-labrador.jpg'),
  ('00000000-0000-4000-8000-000000000114'::uuid, '/pets/nova-pariah.jpg'),
  ('00000000-0000-4000-8000-000000000115'::uuid, '/pets/lucky-dachshund.jpg'),
  ('00000000-0000-4000-8000-000000000116'::uuid, '/pets/chai-rajapalayam.jpg'),
  ('00000000-0000-4000-8000-000000000117'::uuid, '/pets/kittu-mudhol-hound.jpg'),
  ('00000000-0000-4000-8000-000000000118'::uuid, '/pets/ruby-pomeranian.jpg'),
  ('00000000-0000-4000-8000-000000000119'::uuid, '/pets/oscar-indie.jpg'),
  ('00000000-0000-4000-8000-000000000120'::uuid, '/pets/meera-golden.jpg'),
  ('00000000-0000-4000-8000-000000000121'::uuid, '/pets/whiskers-persian.jpg'),
  ('00000000-0000-4000-8000-000000000122'::uuid, '/pets/pudding-domestic-longhair.jpg'),
  ('00000000-0000-4000-8000-000000000123'::uuid, '/pets/pixel-bengal.jpg'),
  ('00000000-0000-4000-8000-000000000124'::uuid, '/pets/snowy-himalayan.jpg'),
  ('00000000-0000-4000-8000-000000000125'::uuid, '/pets/tofu-bombay.jpg'),
  ('00000000-0000-4000-8000-000000000126'::uuid, '/pets/kiki-indie-cat.jpg'),
  ('00000000-0000-4000-8000-000000000127'::uuid, '/pets/cleo-siamese.jpg'),
  ('00000000-0000-4000-8000-000000000128'::uuid, '/pets/ginger-orange-tabby.jpg'),
  ('00000000-0000-4000-8000-000000000129'::uuid, '/pets/nori-tuxedo.jpg'),
  ('00000000-0000-4000-8000-000000000130'::uuid, '/pets/olive-calico.jpg'),
  ('00000000-0000-4000-8000-000000000131'::uuid, '/pets/thumper-dutch-rabbit.jpg'),
  ('00000000-0000-4000-8000-000000000132'::uuid, '/pets/clover-lionhead-rabbit.jpg'),
  ('00000000-0000-4000-8000-000000000133'::uuid, '/pets/mochi-mini-rex.jpg'),
  ('00000000-0000-4000-8000-000000000134'::uuid, '/pets/hazel-lop-rabbit.jpg'),
  ('00000000-0000-4000-8000-000000000135'::uuid, '/pets/kiwi-budgerigar.jpg'),
  ('00000000-0000-4000-8000-000000000136'::uuid, '/pets/peanut-guinea-pig.jpg')
) as images(id, image_url)
where p.id = images.id
  and p.image_url is distinct from images.image_url;

commit;
