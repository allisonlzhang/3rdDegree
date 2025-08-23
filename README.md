# 3rdDegree

## About the Project 

The Kevin Bacon rule: everyone is connected to Kevin Bacon (and anyone else in the world) by at most 6 degrees of separation. 

My friends all want to meet new people, but it feels like once you've established a social circle and environment you only see the same people at every function. This app is meant to facilitate a more organic way to meet new people that are still connected through various degrees of connection. This is done by creating a party-invite system that encourages you to introduce your friends that might not have otherwise met to each other. 

This is a passion project dedicated to my friends, and maybe one day my home (greater NYC area). 

## The Goals and Metrics

1. **Facilitate organic connections**
   - Metric: Number of new connections made per event.

2. **Encourage diverse interactions**
   - Metric: Percentage of attendees meeting new people.

3. **Promote inclusivity**
   - Metric: Feedback score on inclusivity from surveys.

4. **Build a strong user base**
   - Metric: Feedback score on wanting to use app again from surveys. 

## Assumptions and Constraints

- The host would want to invite a diverse group of people/not all in the same friend group.
- The guests want to invite someone that doesn't already know the person who sent the previous invite.
- I am limited to free templates online and free versions of coding assistance, only have OpenAI subscription.
- Scale is limited to the DB stored in ###. 
- Hosting the site through my GitHub. 
- If the invitee says yes and then changes to no, then the inviter keeps their successsful RSVP yes status.
- Assume everyone is in the same time zone. 
- Assume that people aren't gaming the system/creating fake people in order to successfully rsvp themselves. 

## Features

1. **Create Party Page**
   - Enter in a Party Name, a Location, and a Time/Date
   - "Create Party" button

2. **Party Created Confirmation Page**
   - Confirmation message of party created 
   - Invite link generated
   - Copy link button 

3. **Account Creation Page**
   - Enter name textbox 
   - "Log in" button

3. **Guest Landing Page (Degrees 1 & 2)**
   - RSVP options (Yes/Maybe/No)
   - Shows if RSVP yes successful or needs to meet invite requirements
   - Invite link generated
   - Copy link button 

3. **Guest Landing Page (Degree 3)**
   - RSVP options (Yes/Maybe/No)
   - Shows if RSVP yes successful

4. **Party Started Page**
   - RSVPs are locked, no new RSVPs accepted
   - All invite pages lead to a sign on page

4. **Graph Page**
   - After signed in, shows graph of every name as a node and the edges between the nodes
   - Signed in user sees their node in a different color 

## Release Criteria

- All pages load and look like designs
- Invite link / graph edge tracking works 
- RSVPs accurately documented based on requirements
- All buttons add to DB as expected

## Scope

### Within MVP Scope: 
- 
### Future Features/Considerations: 
- Prevent people from gaming the system
- Host override capabilities on approvals, capping attendance, capping invites
