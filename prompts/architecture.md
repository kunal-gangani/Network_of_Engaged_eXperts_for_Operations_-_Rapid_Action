npm run build is failing because IssueCard.tsx imports @/utils/date, but utils/date.ts does not exist.

Please search the project for all imports from @/utils/date.

Either:

recreate utils/date.ts with the required utility functions (including timeAgo), or
replace the import with the correct existing utility.

After fixing, run npm run build again and continue fixing any remaining TypeScript errors until the build succeeds.