### **Git Workflow Guide**

1️⃣ Always branch from `develop`

`git checkout develop`  
`git pull`  
`git checkout -b feature/<your-feature>`

2️⃣ Commit clearly

`feat(mobile): add login screen`  
`fix(api): correct order amount`

3️⃣ Sync with latest `develop` often

`git fetch origin`  
`git rebase origin/develop`  
`# fix conflicts -> git add . -> git rebase --continue`  
`git push`

4️⃣ NEVER commit directly to `develop` shared area without PR  
→ All work in feature branches → reviewed PR → merge.

---

### **⚙️ 5️⃣ Merge Rules**

#### **✅ When merging your feature branch into `develop`**

`git checkout develop`  
`git pull`  
`git merge feature/<your-feature> --no-ff`  
`# Fix conflicts if any`  
`git push origin develop`

💡 `--no-ff` keeps clean history.  
💡 Always run `npm run build` before pushing.

#### **🚫 Don’t use:**

* `git merge --strategy-option theirs/ours` blindly  
* `--force` on shared branches

#### **🧱 If you see conflicts:**

1. Open files in VS Code → choose correct version

After fixing:  
`git add .`  
`git merge --continue`

2.   
3. Rebuild and test before push.

---

### **🧰 6️⃣ Prisma Migration Rules**

`git pull origin develop`  
`npx prisma migrate dev -n <meaningful_name>`  
`git add prisma/`  
`git commit -m "db: add new field to orders"`

---

### **🔄 7️⃣ After Merge Cleanup**

`git branch -d feature/<your-feature>`  
`git push origin --delete feature/<your-feature>`

---

### **💡 8️⃣ General Tips**

* Pull before starting every day  
* Rebase before pushing  
* Keep branches small (1 feature only)  
* Don’t leave feature branches unmerged \>3 days
