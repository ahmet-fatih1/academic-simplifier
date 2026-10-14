import SimplifierPage from "../components/SimplifierPage";
import { SEO_PAGES, findSeoPage } from "../lib/seo-pages";

export default function ToolPage({ seo }) {
  return <SimplifierPage seo={seo} />;
}

export function getStaticPaths() {
  return {
    paths: SEO_PAGES.map((page) => ({ params: { slug: page.slug } })),
    fallback: false,
  };
}

export function getStaticProps({ params }) {
  const page = findSeoPage(params.slug);
  return { props: { seo: { ...page, path: page.slug } } };
}
