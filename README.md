To build locally:
npm run build

To run locally (should be on some localhost port 5***)
npm run dev (test)
npm run start (production)

To install all dependencies:
npm install

You should not need to connect locally to Supabase at all as that is done through APIs in the code. If you do, here are the commands to install the needed packages, at least on Mac unfortunately:
brew install supabase
supabase start

TO LAUNCH WITH VITE, NAVIGATE INTO THE my-app FOLDER. DO NOT TRY TO LAUNCH IN MAIN FOLDER. This was a stupid file directory quirk I decided not to fix because why the hell.