import { NewsController } from "@/lib/controllers/news.controller";

const controller = new NewsController();

export const GET = (req: Request) => {
  const { searchParams } = new URL(req.url);
  if (searchParams.has("sources")) return controller.sources();
  return controller.getNews(req);
};
