---
title: I Built an AI-Powered API Linter in a Weekend (So You Don't Have To)
published: false
description: A weekend project that turned into a useful tool for validating OpenAPI specs with AI-powered suggestions
tags: api, nodejs, webdev, opensource
cover_image: [your-cover-image-url]
---

## The Embarrassing Realization

Last Saturday, I was feeling pretty good about myself. I'd just finished building three microservices for a side project. Clean code, tests passing, ready to ship.

Then I opened all three OpenAPI specs side by side to write some documentation.

My heart sank.

- **User Service**: `userId` (camelCase)
- **Order Service**: `user_id` (snake_case)
- **Payment Service**: `UserID` (PascalCase)

Three different naming conventions. Same project. Same developer. Two weeks apart.

If I couldn't maintain consistency in my own code, what hope did a team have? What about open source contributors who'd never seen our codebase?

I needed to fix this. And I had a free weekend.

## The Problem Nobody Talks About

Here's what nobody tells you about building microservices:

The code might work perfectly, but if your APIs are inconsistent, you're building technical debt that will haunt you. Different field names, missing descriptions, inconsistent error formats—these aren't just "nice to haves." They're the difference between APIs that are a joy to use and APIs that make developers curse your name.

I'd tried the usual approaches:
- **Style guides?** Written, shared, promptly ignored.
- **PR reviews?** I'd leave the same comments over and over.
- **Slack reminders?** Effective for about 3 days.

None of it stuck. People (including me) forget. We copy-paste from old code. We're in a hurry. We think "I'll fix it later."

There had to be a better way.

## What I Built Instead

Over that weekend, I built an API linter that:
- Validates OpenAPI/Swagger specs
- Catches inconsistencies automatically
- Suggests fixes using AI (optional)
- Learns patterns from your existing APIs

The best part? It's actually simple to use:

```bash
node bin/api-linter.js your-api.yaml
```

That's it. No config files, no setup wizards, no 50-page documentation to read first.

## Why Not Just Use [Insert Popular Tool]?

Good question. I looked at the existing options:

**Spectral** is powerful but overwhelming. The documentation alone made my head spin. Do I really need 100+ rules for a small project?

**Redocly** looks great but costs more than my monthly coffee budget. And I'm not ready to commit to a vendor for a side project.

**SwaggerHub** wants to manage my entire API lifecycle. I just wanted validation.

I needed something lighter. Something I could understand and modify. Something that didn't assume I had a team of API architects.

## The Build Log (Or: How I Spent My Weekend)

### Saturday, 9 AM: The Decision

First coffee of the day. I opened my code editor and thought: "How hard can this be?"

The plan was simple:
1. Parse YAML files
2. Check for common issues
3. Print results

Aim for "working prototype" by Sunday night. If it's useful, iterate. If not, at least I learned something.

### Saturday, 10 AM: Architecture

I made one key decision that saved me later: make each validation rule its own module.

```javascript
class DescriptionValidator {
  validate(spec) {
    // Check if descriptions exist and make sense
    const issues = [];
    // ... validation logic
    return issues;
  }
}
```

Why? Because I knew I'd want to add more validators later. And I'd want to turn some off for certain projects. Modular from day one.

### Saturday Afternoon: The Core

First step was stupidly simple:

```javascript
const yaml = require('js-yaml');
const fs = require('fs');

const spec = yaml.load(fs.readFileSync('api.yaml', 'utf8'));
console.log('Loaded!', Object.keys(spec));
```

Seeing those keys print out felt good. The project was real now.

Then I built the first validator. Just one. The description checker:

```javascript
if (!schema.description) {
  issues.push({
    severity: 'error',
    message: `Schema '${name}' is missing a description`,
    location: `components.schemas.${name}`
  });
}
```

Ran it on my messy API specs. Found 47 missing descriptions. Ouch.

But it worked! I had a tool that could find problems automatically.

### Saturday Evening: The Validation Army

Once I had one validator working, I got greedy. Why stop there?

I built 10 more:
- Common field validator (catches `userId` vs `user_id` issues)
- Error response validator (consistent error formats)
- Schema validator (types, formats, required fields)
- Path validator (RESTful conventions)
- Parameter validator
- Response validator
- Security validator
- Reference validator (catches broken `$ref` links)
- Enum validator
- Pagination validator

Each one was 50-100 lines. Simple, focused, testable.

By midnight, I could run one command and get a full report on everything wrong with my API specs.

### Sunday Morning: The AI Epiphany

Here's where it got interesting.

The linter could tell me "field name is wrong," but it couldn't tell me what the RIGHT name should be. That required understanding context.

I'd been playing with Google's Gemini API that week. What if...

```javascript
async function getAISuggestion(issue, context) {
  const prompt = `
    API validation issue: ${issue.message}
    
    Context: ${JSON.stringify(context, null, 2)}
    
    Suggest a specific fix with a code example.
  `;
  
  const result = await gemini.generateContent(prompt);
  return result.text();
}
```

The first time I saw it suggest the correct field name AND explain why, I actually said "whoa" out loud to my empty apartment.

Cost? About $0.03 per API validation. Totally worth it.

But I made it optional. Not everyone wants to send their specs to external APIs. The linter works fine without AI—it's just less helpful.

### Sunday Afternoon: Learning from Existing Code

The second big idea hit me while eating lunch.

Why make people configure standards manually? Their existing APIs already show their patterns. Just learn from those.

I built a discovery tool:

```bash
node bin/discover-standards.js --scan ./apis/
```

It reads all your existing OpenAPI specs and figures out:
- How you name fields (camelCase? snake_case?)
- What descriptions look like
- Common patterns you use

Then it generates a config file. Now the linter enforces YOUR team's standards, not some generic rulebook.

### Sunday Evening: The Web UI

By 6 PM, the CLI was working great. But I knew not everyone loves terminal commands.

I spent two hours building a simple web interface:
- Drag and drop YAML files
- See results in a nice table
- Download reports

No fancy framework. Just Express.js, some vanilla JavaScript, and Tailwind CSS for styling. It works offline, loads instantly, and doesn't require 500MB of node_modules.

```bash
npm start
# Open http://localhost:3000
```

Done.

## Real Talk: What This Actually Solves

Let me be honest about what this tool is and isn't.

**It's NOT:**
- A replacement for good API design knowledge
- A silver bullet that fixes bad architecture
- Enterprise-grade software with SLAs and support

**It IS:**
- A time-saver for common checks
- A teaching tool for junior developers
- A way to enforce consistency without nagging
- Good enough for small teams and side projects

I use it on every API I build now. It catches dumb mistakes before they reach code review. My team uses it. A few folks from Twitter are using it.

Is it perfect? No. But it's useful. And it was fun to build.

## Lessons from Building This

**Start smaller than you think.** My initial plan had 20 validators. I built 3 first. Tested them. Built more. Much better approach.

**Make it fast.** First version took 4 seconds to run. I optimized to 50ms. Nobody wants to wait for a linter. Speed matters.

**Error messages are harder than the validation.** Writing code to detect issues is easy. Writing helpful error messages that actually guide people to fixes? That's the hard part.

**AI is cheap now.** $0.03 per validation means AI features are accessible for hobby projects. We're living in interesting times.

**Offline-first is still important.** Not everyone wants cloud dependencies. The tool works great without internet. AI is a bonus, not a requirement.

## The Code (It's Open Source)

Everything is on GitHub with an MIT license:
[github.com/yourusername/api-linter](https://github.com/yourusername/api-linter)

Want to try it?

```bash
git clone https://github.com/yourusername/api-linter.git
cd api-linter
npm install
node bin/api-linter.js examples/flights-good.yaml
```

Found a bug? Have an idea? PRs welcome. I built this for me, but I'm happy if it helps others.

## What's Next

I've got a few ideas:

**VS Code Extension**: Validate as you type. Show squiggly lines under issues. Auto-fix on save.

**More AI Features**: "Review this entire API design" mode. Generate example requests. Suggest improvements.

**GraphQL Support**: Because not everyone uses REST.

But honestly? The current version does what I need. If I never touch it again, it's still useful. That's the beauty of weekend projects—they don't have to be perfect.

## If You're Building Something Similar

Some advice if you want to build your own tooling:

**Solve your own problem first.** Don't build for "developers" or "startups." Build for you. If it solves your problem, it'll probably help others too.

**Ship something minimal fast.** My first version had 3 validators and a CLI. That was enough to be useful. Everything else came later.

**Make it easy to run.** One command. No config required to start. You can add config later for power users.

**Document by example.** Show working code, not abstract explanations. Developers learn by seeing, not reading.

**Open source from day one.** Even if it's messy. Someone might find it useful. Or they'll tell you what's broken.

## The End (Or the Beginning?)

That weekend project is now something I use every day. It's not going to change the world. But it makes my world a little better.

If you're building APIs and tired of manual reviews, give it a try. If you learn something from the code, even better.

And if you can't keep your own API naming consistent (like me), know that you're not alone. We're all just making this up as we go along.

Happy coding. 👨‍💻

---

**About Me**: I'm a developer who builds things to scratch my own itches. Sometimes they're useful to others. You can find me on [GitHub](https://github.com/yourusername) or [Twitter](https://twitter.com/yourhandle).

**GitHub**: https://github.com/yourusername/api-linter  
**Demo**: http://your-demo-url (if you have one)

---

*What's the most embarrassing inconsistency you've found in your own code? Let me know in the comments—misery loves company!*
