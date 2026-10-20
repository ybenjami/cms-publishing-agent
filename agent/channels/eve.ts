import { eveChannel } from "eve/channels/eve";
import { type AuthFn, localDev, placeholderAuth, vercelOidc } from "eve/channels/auth";

const isLocalDev = localDev();

/**
 * The Contentful connection is user-scoped: each person signs in to
 * Contentful as themselves. That needs a user principal on the session, and
 * the plain `localDev()` principal is not one. During `eve dev` only, this
 * treats the local developer as a user so the Contentful sign-in can run in
 * the terminal UI. It also lets local evals stub tool results, so they never
 * write to Contentful. `localDev()` matches nothing in production, so
 * neither does this.
 */
const localDeveloper: AuthFn<Request> = async (request) => {
  const caller = await isLocalDev(request);
  if (!caller) return null;
  return {
    ...caller,
    principalType: "user",
    principalId: "local-developer",
    allowToolStubs: true,
  };
};

export default eveChannel({
  auth: [
    // Lets the eve TUI and your Vercel deployments reach the deployed agent.
    vercelOidc(),
    // Local development only; see above.
    localDeveloper,
    // Rejects browser requests in production until real auth is configured.
    placeholderAuth(),
  ],
});
