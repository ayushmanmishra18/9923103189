# Notification System Design
 1. API Design
- `GET /notifications` - fetch inbox, use limit/page to not overload.
- `PATCH /notifications/:id/read` - mark as read. Patch is idempotent so clicking it twice won't break things.
- `POST /notifications` - make a new one. 
- Use SSE (Server-Sent Events) to push to the frontend. WebSockets are too heavy since the client doesn't really send much back.

 2. Database Design
Postgres is better here because notifications link to users and we need strict tracking of who read what. MongoDB is too loose for this.
Table: `id`, `user_id`, `type`, `msg`, `read`, `created_at`.
We definitely need an index on `(user_id, read, created_at DESC)` otherwise fetching the inbox will be super slow.
Old data (like 1+ years) can just be dumped to S3 so the DB stays fast.


 4. Performance
Hitting the DB on every page refresh just for the unread count will kill the server. 
Redis cache helps here. Just keep `unread:user:1042 = 5` in Redis. When a new one arrives, do an `INCR`. When read, `DECR`. Only hit the actual DB when they click the bell icon to see the list.

 5. Massive Fanout
Doing a `for` loop to send emails to 50k students will crash or time out.
Instead, use RabbitMQ or Kafka.
1. Save the broadcast intent to DB.
2. Toss an event to a queue.
3. Background workers pick it up and chunk it out into smaller email tasks.
4. Other workers actually send the emails. If SMTP fails, retry. If it keeps failing, toss it into a dead-letter queue so we can check it later.
