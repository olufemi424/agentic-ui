Welcome to your new TanStack app! 

# Getting Started

To run this application:

```bash
pnpm install
pnpm dev
```

# Building For Production

To build this application for production:

```bash
pnpm build
```

## Testing

This project uses [Vitest](https://vitest.dev/) for testing. You can run the tests with:

```bash
pnpm test
```

## Styling

This project uses [Tailwind CSS](https://tailwindcss.com/) for styling.



# TanStack Chat Application

An example chat application built with TanStack Start, TanStack Store, and OpenAI (via ai-sdk).

## .env Updates

```env
OPENAI_API_KEY=your_openai_api_key
```

## ✨ Features

### AI Capabilities
- 🤖 Powered by OpenAI gpt-4o-mini 
- 📝 Rich markdown formatting with syntax highlighting
- 🎯 Customizable system prompts for tailored AI behavior
- 🔄 Real-time message updates and streaming responses

### User Experience
- 🎨 Modern UI with Tailwind CSS and Lucide icons
- 🔍 Conversation management and history
- 🔐 Secure API key management
- 📋 Markdown rendering with code highlighting

### Technical Features
- 📦 Centralized state management with TanStack Store
- 🔌 Extensible architecture for multiple AI providers
- 🛠️ TypeScript for type safety

## Architecture

### Tech Stack
- **Frontend Framework**: TanStack Start
- **Routing**: TanStack Router
- **State Management**: TanStack Store
- **Styling**: Tailwind CSS
- **AI Integration**: OpenAI via `@ai-sdk/openai`


## Routing
This project uses [TanStack Router](https://tanstack.com/router). The initial setup is a file based router. Which means that the routes are managed as files in `src/routes`.

### Adding A Route

To add a new route to your application just add another a new file in the `./src/routes` directory.

TanStack will automatically generate the content of the route file for you.

Now that you have two routes you can use a `Link` component to navigate between them.

### Adding Links

To use SPA (Single Page Application) navigation you will need to import the `Link` component from `@tanstack/react-router`.

```tsx
import { Link } from "@tanstack/react-router";
```

Then anywhere in your JSX you can use it like so:

```tsx
<Link to="/about">About</Link>
```

This will create a link that will navigate to the `/about` route.

More information on the `Link` component can be found in the [Link documentation](https://tanstack.com/router/v1/docs/framework/react/api/router/linkComponent).

### Using A Layout

In the File Based Routing setup the layout is located in `src/routes/__root.tsx`. Anything you add to the root route will appear in all the routes. The route content will appear in the JSX where you use the `<Outlet />` component.

Here is an example layout that includes a header:

```tsx
import { Outlet, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

import { Link } from "@tanstack/react-router";

export const Route = createRootRoute({
  component: () => (
    <>
      <header>
        <nav>
          <Link to="/">Home</Link>
          <Link to="/about">About</Link>
        </nav>
      </header>
      <Outlet />
      <TanStackRouterDevtools />
    </>
  ),
})
```

The `<TanStackRouterDevtools />` component is not required so you can remove it if you don't want it in your layout.

More information on layouts can be found in the [Layouts documentation](https://tanstack.com/router/latest/docs/framework/react/guide/routing-concepts#layouts).


## Data Fetching

There are multiple ways to fetch data in your application. You can use TanStack Query to fetch data from a server. But you can also use the `loader` functionality built into TanStack Router to load the data for a route before it's rendered.

For example:

```tsx
const peopleRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/people",
  loader: async () => {
    const response = await fetch("https://swapi.dev/api/people");
    return response.json() as Promise<{
      results: {
        name: string;
      }[];
    }>;
  },
  component: () => {
    const data = peopleRoute.useLoaderData();
    return (
      <ul>
        {data.results.map((person) => (
          <li key={person.name}>{person.name}</li>
        ))}
      </ul>
    );
  },
});
```

Loaders simplify your data fetching logic dramatically. Check out more information in the [Loader documentation](https://tanstack.com/router/latest/docs/framework/react/guide/data-loading#loader-parameters).

### React-Query

React-Query is an excellent addition or alternative to route loading and integrating it into you application is a breeze.

First add your dependencies:

```bash
pnpm add @tanstack/react-query @tanstack/react-query-devtools
```

Next we'll need to create a query client and provider. We recommend putting those in `main.tsx`.

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// ...

const queryClient = new QueryClient();

// ...

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);

  root.render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
```

You can also add TanStack Query Devtools to the root route (optional).

```tsx
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

const rootRoute = createRootRoute({
  component: () => (
    <>
      <Outlet />
      <ReactQueryDevtools buttonPosition="top-right" />
      <TanStackRouterDevtools />
    </>
  ),
});
```

Now you can use `useQuery` to fetch your data.

```tsx
import { useQuery } from "@tanstack/react-query";

import "./App.css";

function App() {
  const { data } = useQuery({
    queryKey: ["people"],
    queryFn: () =>
      fetch("https://swapi.dev/api/people")
        .then((res) => res.json())
        .then((data) => data.results as { name: string }[]),
    initialData: [],
  });

  return (
    <div>
      <ul>
        {data.map((person) => (
          <li key={person.name}>{person.name}</li>
        ))}
      </ul>
    </div>
  );
}

export default App;
```

You can find out everything you need to know on how to use React-Query in the [React-Query documentation](https://tanstack.com/query/latest/docs/framework/react/overview).

## State Management

Another common requirement for React applications is state management. There are many options for state management in React. TanStack Store provides a great starting point for your project.

First you need to add TanStack Store as a dependency:

```bash
pnpm add @tanstack/store
```

Now let's create a simple counter in the `src/App.tsx` file as a demonstration.

```tsx
import { useStore } from "@tanstack/react-store";
import { Store } from "@tanstack/store";
import "./App.css";

const countStore = new Store(0);

function App() {
  const count = useStore(countStore);
  return (
    <div>
      <button onClick={() => countStore.setState((n) => n + 1)}>
        Increment - {count}
      </button>
    </div>
  );
}

export default App;
```

One of the many nice features of TanStack Store is the ability to derive state from other state. That derived state will update when the base state updates.

Let's check this out by doubling the count using derived state.

```tsx
import { useStore } from "@tanstack/react-store";
import { Store, Derived } from "@tanstack/store";
import "./App.css";

const countStore = new Store(0);

const doubledStore = new Derived({
  fn: () => countStore.state * 2,
  deps: [countStore],
});
doubledStore.mount();

function App() {
  const count = useStore(countStore);
  const doubledCount = useStore(doubledStore);

  return (
    <div>
      <button onClick={() => countStore.setState((n) => n + 1)}>
        Increment - {count}
      </button>
      <div>Doubled - {doubledCount}</div>
    </div>
  );
}

export default App;
```

We use the `Derived` class to create a new store that is derived from another store. The `Derived` class has a `mount` method that will start the derived store updating.

Once we've created the derived store we can use it in the `App` component just like we would any other store using the `useStore` hook.

You can find out everything you need to know on how to use TanStack Store in the [TanStack Store documentation](https://tanstack.com/store/latest).

# Demo files

Files prefixed with `demo` can be safely deleted. They are there to provide a starting point for you to play around with the features you've installed.

# Learn More

You can learn more about all of the offerings from TanStack in the [TanStack documentation](https://tanstack.com).



---

# Architecture & Data Flow

This app wires a React chat UI to a server route that streams AI responses and exposes server-side tools for the model to call. A small product dataset (guitars) is used to demonstrate tool usage and image handling. The chat server uses OpenAI via `@ai-sdk/openai` with model `gpt-4o-mini`.

## High-level diagram

```
+---------------------+           +------------------------------+
|  React Client (UI)  |           |  Server (TanStack Start)     |
|  - Chat page        |  HTTP     |  - /api/demo-chat (POST)     |
|  - Markdown render  +---------->+  - Tools (getGuitars, ...)   |
|  - Tool UI cards    |  Stream   |  - AI provider (OpenAI)      |
+----------+----------+  (SSE)    +-------------------+----------+
           ^                                               |
           |                                               |
           |                         Tools return product  |
           |                         data w/ image URLs    v
           |                                          +----+-----+
           |                                          | Dataset  |
           |                                          | guitars  |
           |                                          +----------+
```

## Key pieces

- Frontend routes
  - `src/routes/index.tsx`: chat page (large UI), uses `useChat` to call `/api/demo-chat`. Renders Markdown and tool outputs.
  - `src/components/example-AIAssistant.tsx`: compact assistant UI (toggleable), same message rendering patterns.
  - `src/routes/example.guitars/*`: product listing and detail pages for the demo guitars.

- Server route
  - `src/routes/api.demo-chat.ts`: POST handler that:
    - Parses incoming messages
    - Derives `origin` from request headers/URL
    - Instantiates tools with `{ origin }`
    - Calls `streamText` with system prompt + tools
    - Streams back UI messages to the client

- Tools and data
  - `src/utils/demo.tools.ts`:
    - `getGuitars`: returns guitars with absolute `image` URLs built from `origin`
    - `recommendGuitar`: returns a selected id (UI renders a card)
  - `src/data/example-guitars.ts`: static demo dataset with relative `image` paths (e.g. `/example-guitar-...jpg`)

- Image origin handling
  - Server ensures absolute URLs via `origin` so the model doesn’t invent hosts
  - Client Markdown components defensively normalize `<img src>` to the current `window.location.origin` for known guitar images

- MCP demo (optional example)
  - `src/utils/demo.sse.ts`: shows how an MCP server could expose a `getGuitars` tool over SSE. Not used by `/api/demo-chat`, but demonstrates the pattern.

## Request/response flow

```
User types → Client sends POST /api/demo-chat with messages
           → Server builds tools (origin-aware)
           → AI model receives messages + tool schema
           → Model may call tool: getGuitars{}
           → Tool returns guitars[] with absolute image URLs
           → Model composes Markdown + optional tool tags
           → Server streams chunks → Client renders
```

### Detailed sequence

1) Client
```
useChat({ api: "/api/demo-chat" })
  └─ sendMessage({ text })
     └─ POST messages to server
```

2) Server
```
POST /api/demo-chat
  ├─ const origin = derive from X-Forwarded-*/URL
  ├─ const tools = await getTools({ origin })
  ├─ streamText({ model, messages, tools, system })
  └─ return result.toUIMessageStreamResponse()
```

3) Tool execution (example)
```
getGuitars.execute()
  └─ maps dataset → { ...guitar, image: `${origin}${guitar.image}` }
  └─ returns JSON array
```

4) Client rendering
```
- Text parts → ReactMarkdown
- Tool parts → custom UI (e.g., GuitarRecommendation)
- Images → normalized to current host if needed
```

## Files map

- Chat UI
  - `src/routes/index.tsx`
  - `src/components/example-AIAssistant.tsx`

- AI/Server
  - `src/routes/api.demo-chat.ts`
  - `src/utils/demo.tools.ts`

- Demo data & pages
  - `src/data/example-guitars.ts`
  - `src/routes/example.guitars/index.tsx`
  - `src/routes/example.guitars/$guitarId.tsx`

- Optional MCP demo
  - `src/utils/demo.sse.ts`

## How MCP-style tools fit (conceptually)

- The server defines tool endpoints with schemas (name, input, execute)
- The AI runtime (`streamText`) advertises these tools to the model
- The model calls tools by name with inputs; the runtime invokes them
- Outputs are streamed back as structured parts, which the client can render

ASCII of tool invocation path:
```
Model ↔ streamText ↔ tools.execute(input)
                      │
                      ├─ read dataset
                      └─ return JSON (absolute image URLs)
```

## Deployment notes

- Ensure reverse proxy passes `X-Forwarded-Proto` and `X-Forwarded-Host` so `origin` is correct
- Static images live in `public/` and are served by the host (Vite/adapter)
- In dev, images resolve to `http://localhost:<port>/...`; in prod, to your domain

## Local development

```bash
pnpm install
pnpm start
# open http://localhost:3000
```

## Prompting tips

- Ask: "i will like to see the picture of all the guiter available"
- The assistant will call `getGuitars`, render images with the correct host
