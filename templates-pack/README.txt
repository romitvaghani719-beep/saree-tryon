Saree Try On - drape templates

original-models/model-N/
  cutout.webp   the model photo with the saree area transparent (drawn on top)
  bw.webp       the same photo in black and white: the folds
  photo-thumb   the original photo (thumbnail)
  meshes.json   the traced saree meshes with UV (into bw) and UV2 (into the fabric) for all three

holo-poses/holo-NN/
  mannequin.webp  the model plate, transparent over the drape
  shading.webp    the fold field (multiplier), range in template.json
  panels.png      region index per pixel (255 = not drape)
  uv.png          per-pixel cloth coordinates, 16-bit: u = R*256+G, v = B*256+A
  template.json   region spans/roles, saree width in px
  thumb.webp      picker thumbnail

reference/
  labelled-saree.webp   green = left border, blue = right border, red = pallu end, rows 1-8 along the length
  diag-model1/2/3.png   the labelled saree on the three original templates
  diag-compare.png      side by side
  d-holo-NN.png         the labelled saree on each holo pose (current mapping, not yet verified pose by pose)
