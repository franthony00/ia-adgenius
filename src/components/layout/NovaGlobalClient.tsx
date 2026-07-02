'use client';

import dynamic from 'next/dynamic';

// NovaGlobal must only run on the client — it uses browser APIs and
// a class Error Boundary that cannot hydrate from SSR output.
const NovaGlobal = dynamic(() => import('./NovaGlobal'), { ssr: false });

export default function NovaGlobalClient() {
  return <NovaGlobal />;
}
