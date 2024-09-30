const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose')
mongoose.connect('mongodb+srv://bombel132:7zQo1xQj1LVjkRdH@cluster0.pgnwl.mongodb.net/Node-API?retryWrites=true&w=majority&appName=Cluster0')
.then(() => {
  console.log("Connected!")
}).catch(() => {
  console.log("Connection failed")
});
const { ObjectId } = mongoose.Types
app.use(express.json())
app.use(cors())
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


const usersSchema = mongoose.Schema({
  user: {
    type: String,
    required: true
  },
  log: [{
    description: String,
    duration: Number,
    date: String
  }]
})

const usersModel = mongoose.model("Users", usersSchema)

app.post("/api/users", async function(req, res) {
  try{
    await usersModel.create({user: req.body.username})
    const user = await usersModel.findOne({user: req.body.username})
    res.json({username: req.body.username, _id: user._id})
  }catch(error){
    res.json({"error": error.message})
  }
})

app.get("/api/users", async (req, res) => {
  try {
    const users = await usersModel.find({},{_id: 1, user: 1})
    const formatted_users = users.map(user => ({
      _id: user._id,
      username: user.user
    }))
    res.json(formatted_users)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post("/api/users/:id/exercises", async function(req,res){
  try{
    if (!req.params.id || !req.body.description || !req.body.duration){
      return res.status(400).json({ error: "Mandatory paramter is missing" })
    }
  let date
  

  if (!req.body.date){
    const today = new Date()
    date = today.toISOString().split('T')[0]
  }else{
    date = req.body.date
  }
  const obj = await usersModel.findById(new ObjectId(req.params.id))
  const dateObj = new Date(date)
  const formattedDate = dateObj.toDateString()
  obj.log.push({
    description: req.body.description,
    duration: req.body.duration,
    date: formattedDate
  })
  let dur
  try{
    dur = Number(req.body.duration)
  }catch(error){
    return res.status(400).json({ error: "Duration is not a number" })
  }
  await obj.save()
  console.log(obj)
  res.json({_id: obj._id, username: obj.user, date: formattedDate, duration: dur, description: req.body.description})
}
  
  catch (error){
    res.status(500).json({ error: error.message })
  }

})

app.get('/api/users/:_id/logs', async (req,res) =>{
  try{
    const {from, to, limit} = req.query
    result = await usersModel.findById(new ObjectId(req.params._id)).lean()
    result.count = result.__v
    delete result.__v
    let logs = result.log
    if (result){
      if (from) {
        fromDate = new Date(from)
        const stringFrom = `${fromDate.getFullYear()}-${(fromDate.getMonth() + 1).toString().padStart(2, '0')}-${fromDate.getDate().toString().padStart(2, '0')}`
        const dateFrom = new Date(stringFrom)
        result.log = result.log.filter(log => {
          return new Date(log.date) >= dateFrom
        })
      }
      if (to) {
        toDate = new Date(to)
        const stringTo = `${toDate.getFullYear()}-${(toDate.getMonth() + 1).toString().padStart(2, '0')}-${toDate.getDate().toString().padStart(2, '0')}`
        const dateTo = new Date(stringTo)
        result.log = result.log.filter(log => {
          return new Date(log.date) <= dateTo
        })
      }
      if (limit) {
        result.log = logs.slice(0, parseInt(limit))
      }
    }
    res.json(result)
  }catch(error){
    res.status(500).json({error: error.message})
  }
})



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
