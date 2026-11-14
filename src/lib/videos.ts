// Stand-in video files. Vireo shows real metadata from TMDB, but we don't have
// rights to stream real films, so every title plays one of the Blender
// Foundation's open movies (Creative Commons Attribution), hosted by archive.org.

export interface SampleVideo {
  src: string;
  credit: string;
}

const VIDEOS: SampleVideo[] = [
  {
    src: "https://archive.org/download/BigBuckBunny_124/Content/big_buck_bunny_720p_surround.mp4",
    credit: "Big Buck Bunny · © Blender Foundation · CC BY 3.0",
  },
  {
    src: "https://archive.org/download/Sintel/sintel-2048-stereo_512kb.mp4",
    credit: "Sintel · © Blender Foundation · CC BY 3.0",
  },
  {
    src: "https://archive.org/download/ElephantsDream/ed_hd_512kb.mp4",
    credit: "Elephants Dream · © Blender Foundation · CC BY 2.5",
  },
  {
    src: "https://archive.org/download/Tears-of-Steel/tears_of_steel_720p.mp4",
    credit: "Tears of Steel · © Blender Foundation · CC BY 3.0",
  },
];

/** The same title always gets the same stand-in video. */
export const videoFor = (tmdbId: number): SampleVideo => VIDEOS[tmdbId % VIDEOS.length];
