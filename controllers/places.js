const Company = require('../models/company');
const { cloudinary } = require('../cloudinary');

module.exports.showAll = async (req, res) => {
    const all = await Company.find();

    res.render('cat', { all});
};

module.exports.ushowAll = async (req, res) => {
    const uall = await Company.find();

    res.render('usercat', { uall});
};

module.exports.addPlaceForm = (req, res) => {
    const name = "";
    const description = "";
    res.render('add', { name, description});
};

module.exports.addPlaceDB = async (req, res) => {
    const { name, description, items } = req.body;
    console.log(req.body);



    if (name.trim() !== "" && description.trim() !== "" ) {
        try {

            const newCompany = new Company({
                name: name.trim().charAt(0).toUpperCase() + name.trim().slice(1),
                description: description.trim().charAt(0).toUpperCase() + description.trim().slice(1),
               items
            });

            //newCompany.owner = req.user.id;
            console.log(req.files.map(f=>{return f.path;}))
            newCompany.images = req.files.map(f => ({ url: f.path, filename: f.filename }));
            await newCompany.save();
            //req.flash('success', 'Thanks for registering your place with us...!');
            res.redirect('/cat');
        }
        catch (e) {
            console.log(e);
            //req.flash('error', 'Fill all fields correctly');
            res.redirect('/add');
        }
    }

    else {
        console.log("please fill all fields");

        //req.flash('success', 'Please fill all the fields.');
        res.render('add', { name: name.trim(), description: description.trim()});
    }

};

module.exports.showParticularPlace = async (req, res) => {
    const { id } = req.params;
    const place = await Company.findById(id);


   
    if (place !== null) {
        res.render('show', { place});
    }
    else {
        //req.flash('error', 'Place might be deleted or not yet made.');
        res.redirect('/cat');
    }
};

module.exports.ushowParticularPlace = async (req, res) => {
    const { id } = req.params;
    const place = await Company.findById(id);


   
    if (place !== null) {
        res.render('usershow', { place});
    }
    else {
        //req.flash('error', 'Place might be deleted or not yet made.');
        res.redirect('/usercat');
    }
};

module.exports.updateForm = async (req, res) => {
    const { id } = req.params;
    const place = await Company.findById(id);

    if (place !== null) {
        res.render('update', { place });
    }
    else {
        // req.flash('error', 'Place might be deleted or not yet made.');
        res.redirect('/home');
    }

};


module.exports.updateInDB = async (req, res) => {
    let { name, description, items} = req.body;
    // console.log(items);
    if (items == undefined) items = [];
    console.log("UPDATEINDB");

    if (name.trim() !== "" && description.trim() !== "" ) {
        const place = await Company.findByIdAndUpdate(req.params.id, { name: name.trim(), description: description.trim(), items }, { new: true });
        console.log("HII");
        try {
            // const imgs = req.files.map(f => ({ url: f.path, filename: f.filename }));
            // place.images.push(...imgs);
            place.images=req.files.map(f => ({ url: f.path, filename: f.filename }));
            //place.location = location;
            await place.save();

            // if (req.body.deleteImages) {
            //     for (let filename of req.body.deleteImages) {
            //         await cloudinary.uploader.destroy(filename);
            //     }
            //     await place.updateOne({ $pull: { images: { filename: { $in: req.body.deleteImages } } } });
            // }

            // req.flash('success', 'Successfully updated!!');
            res.redirect(`/show/${req.params.id}`);

        } catch (e) {
            // req.flash('error', e.message);
            const { id } = req.params;
            const place = await Company.findById(id);
            res.render('update', { place });
        }


    }
    else {
        console.log("ELSE");
        const { id } = req.params;
        const place = await Company.findById(id);
        if (place !== null) {
            // req.flash('error', 'Fill all the fields');
            res.render('update', { place });
        }
        else {
            // req.flash('error', 'Place might be deleted or not yet made.');
            res.redirect('/home');
        }
    }

};


module.exports.deletePlace = async (req, res) => {
    const { id } = req.params;
    await Company.findByIdAndDelete(id);
    // console.log("deleted");
    // req.flash('success', 'Deleted the place');
    // res.redirect('/showAll');
    res.redirect('/cat');
};